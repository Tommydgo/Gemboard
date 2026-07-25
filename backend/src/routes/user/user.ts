import express from 'express'
import auth from '../../middleware/auth'
import { user_infos, user_todos, user_infos_mail, delete_user, update_user } from './user.query'
import bcrypt from 'bcryptjs'

const router = express.Router()

router.get('/user', auth, async (req, res) => {

    const id = res.locals.user.id
    const infos = await user_infos(id)

    if (!infos) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json(infos)
})

router.get('/user/todos', auth, async (req, res) => {
    const id = res.locals.user.id
    const todos = await user_todos(id)

    return res.status(200).json(todos)
})

router.get('/users/:id', auth, async (req, res) => {
    const id : number = Number(req.params.id)

    if (Number.isNaN(id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const infos = await user_infos(id)

    if (!infos) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json(infos)
})

router.get('/users/:email', auth, async (req, res) => {
    const mail : string = String(req.params.email)
    const infos = await user_infos_mail(mail)

    if (!infos) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json(infos)
})

router.put('/users/:id', auth, async (req, res) => {
    const id : number = Number(req.params.id)
    let pw = null

    if (Number.isNaN(id))
        return res.status(400).json({ "msg": "Bad parameter" });
    if (!req.body.email || !req.body.name || !req.body.firstname) {
        return res.status(400).json({ "msg": "Bad parameter" });
    }
    if (req.body.password) {
        pw = await bcrypt.hash(req.body.password, 10)
    }
    const status = await update_user(id, req.body.email, pw, req.body.name, req.body.firstname)
    if (status === 0)
        return res.status(404).json({ "msg": "Not found" });
    const updated_user = await user_infos(id);
    return res.status(200).json(updated_user);
})

router.delete('/users/:id', auth, async (req, res) => {
    const id : number = Number(req.params.id)

    if (Number.isNaN(id))
        return res.status(400).json({ "msg": "Bad parameter" });
    const st : number = await delete_user(id)

    if (st === 0) {
        return res.status(404).json({ "msg": "Not found" });
    }
    return res.status(200).json({ "msg": `Successfully deleted record number: ${id}` });
})

export default router
