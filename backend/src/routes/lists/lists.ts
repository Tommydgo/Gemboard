import express from 'express'
import auth from '../../middleware/auth'
import { all_list_infos, list_infos, create_list, update_list, delete_list, move_list } from './lists.query'
import { board_infos } from '../boards/boards.query'

const router = express.Router()

router.get('/lists', auth, async (req, res) => {
    const board_id = Number(req.query.board_id)

    if (Number.isNaN(board_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const infos = await all_list_infos(board_id)

    return res.status(200).json(infos)
})

router.get('/lists/:id', auth, async (req, res) => {
    const list_id = Number(req.params.id)

    if (Number.isNaN(list_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const infos = await list_infos(list_id)

    if (!infos) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json(infos)
})

router.post('/lists', auth, async (req, res) => {
    const { title, board_id } = req.body;

    if (!(title && board_id))
        return res.status(400).json({"msg": "Bad parameter"})
    if (Number.isNaN(Number(board_id)))
        return res.status(400).json({ "msg": "Bad parameter" });

    const target_board = await board_infos(Number(board_id))
    if (!target_board)
        return res.status(404).json({ "msg": "Not found" });

    const list_id = await create_list(title, board_id)
    const list = await list_infos(list_id)
    return res.status(200).json(list)
})

router.put('/lists/:id', auth, async (req, res) => {
    const list_id : number = Number(req.params.id)

    if (Number.isNaN(list_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    if (!req.body.title) {
        return res.status(400).json({ "msg": "Bad parameter" });
    }
    const status = await update_list(req.body.title, list_id)
    if (status === 0)
        return res.status(404).json({ "msg": "Not found" });
    const updated_list = await list_infos(list_id);
    return res.status(200).json(updated_list);
})

router.delete('/lists/:id', auth, async (req, res) => {
    const list_id : number = Number(req.params.id)

    if (Number.isNaN(list_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const st : number = await delete_list(list_id)

    if (st === 0) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json({ "msg": `Successfully deleted record number: ${list_id}` });
})

router.patch('/lists/:id/move', auth, async (req, res) => {
    const list_id : number = Number(req.params.id)
    const position : number = Number(req.body.position)

    if (Number.isNaN(list_id) || Number.isNaN(position))
        return res.status(400).json({ "msg": "Bad parameter" });
    const status = await move_list(list_id, position)
    if (status === 0)
        return res.status(404).json({ "msg": "Not found" });
    const updated_list = await list_infos(list_id);
    return res.status(200).json(updated_list);
})

export default router
