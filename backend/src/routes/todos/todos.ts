import express from 'express'
import auth from '../../middleware/auth'
import { all_todo_infos, todo_infos, create_todo, update_todo, delete_todo, move_todo } from './todos.query'
import { list_infos } from '../lists/lists.query'

const router = express.Router()

router.get('/todos', auth, async (req, res) => {
    const board_id = Number(req.query.board_id)
    const user_id = res.locals.user.id

    if (Number.isNaN(board_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const infos = await all_todo_infos(board_id, user_id)

    return res.status(200).json(infos)
})

router.get('/todos/:id', auth, async (req, res) => {
    const todo_id = Number(req.params.id)
    const user_id = res.locals.user.id

    if (Number.isNaN(todo_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const infos = await todo_infos(todo_id, user_id)

    if (!infos) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json(infos)
})

router.post('/todos', auth, async (req, res) => {
    const { title, description, due_time, list_id } = req.body;
    const user_id = res.locals.user.id

    if (!(title && due_time && list_id))
        return res.status(400).json({"msg": "Bad parameter"})
    if (Number.isNaN(Number(list_id)))
        return res.status(400).json({ "msg": "Bad parameter" });

    const target_list = await list_infos(Number(list_id), user_id)
    if (!target_list)
        return res.status(404).json({ "msg": "Not found" });

    const todo_id = await create_todo(title, description, due_time, user_id, list_id)
    const todo = await todo_infos(todo_id, user_id)
    return res.status(200).json(todo)
})

router.put('/todos/:id', auth, async (req, res) => {
    const todo_id : number = Number(req.params.id)
    const user_id = res.locals.user.id
    const allowed_status = ['todo', 'in progress', 'done']

    if (Number.isNaN(todo_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    if (!req.body.title || !req.body.status || !req.body.due_time) {
        return res.status(400).json({ "msg": "Bad parameter" });
    }
    if (!allowed_status.includes(req.body.status))
        return res.status(400).json({ "msg": "Bad parameter" });
    const status = await update_todo(req.body.title, req.body.description, req.body.status, req.body.due_time, todo_id, user_id)
    if (status === 0)
        return res.status(404).json({ "msg": "Not found" });
    const updated_todo = await todo_infos(todo_id, user_id);
    return res.status(200).json(updated_todo);
})

router.patch('/todos/:id/move', auth, async (req, res) => {
    const todo_id : number = Number(req.params.id)
    const list_id : number = Number(req.body.list_id)
    const position : number = Number(req.body.position)
    const user_id = res.locals.user.id

    if (Number.isNaN(todo_id) || Number.isNaN(list_id) || Number.isNaN(position))
        return res.status(400).json({ "msg": "Bad parameter" });

    const target_list = await list_infos(list_id, user_id)
    if (!target_list)
        return res.status(404).json({ "msg": "Not found" });

    const status = await move_todo(todo_id, list_id, position, user_id)
    if (status === 0)
        return res.status(404).json({ "msg": "Not found" });
    const updated_todo = await todo_infos(todo_id, user_id);
    return res.status(200).json(updated_todo);
})

router.delete('/todos/:id', auth, async (req, res) => {
    const todo_id : number = Number(req.params.id)
    const user_id = res.locals.user.id

    if (Number.isNaN(todo_id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const st : number = await delete_todo(todo_id, user_id)

    if (st === 0) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json({ "msg": `Successfully deleted record number: ${todo_id}` });
})

export default router
