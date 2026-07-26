import express from 'express'
import auth from '../../middleware/auth'
import { all_board_infos, board_infos, create_board, update_board, delete_board } from './boards.query'

const router = express.Router()

router.get('/boards', auth, async (req, res) => {
    const user_id = res.locals.user.id
    const infos = await all_board_infos(user_id)

    return res.status(200).json(infos)
})

router.get('/boards/:id', auth, async (req, res) => {
    const board_id = Number(req.params.id)
    const user_id = res.locals.user.id

    if (Number.isNaN(board_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const infos = await board_infos(board_id, user_id)

    if (!infos) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json(infos)
})

router.post('/boards', auth, async (req, res) => {
    const { name } = req.body;
    const user_id = res.locals.user.id

    if (!name)
        return res.status(400).json({"msg": "Bad parameter"})
    const board_id = await create_board(name, user_id)
    const board = await board_infos(board_id, user_id)
    return res.status(200).json(board)
})

router.put('/boards/:id', auth, async (req, res) => {
    const board_id : number = Number(req.params.id)
    const user_id = res.locals.user.id

    if (Number.isNaN(board_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    if (!req.body.name) {
        return res.status(400).json({ "msg": "Bad parameter" });
    }
    const status = await update_board(req.body.name, board_id, user_id)
    if (status === 0)
        return res.status(404).json({ "msg": "Not found" });
    const updated_board = await board_infos(board_id, user_id);
    return res.status(200).json(updated_board);
})

router.delete('/boards/:id', auth, async (req, res) => {
    const board_id : number = Number(req.params.id)
    const user_id = res.locals.user.id

    if (Number.isNaN(board_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const st : number = await delete_board(board_id, user_id)

    if (st === 0) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json({ "msg": `Successfully deleted record number: ${board_id}` });
})

export default router
