import bcrypt from 'bcryptjs'
import express from 'express'
import { email_taken, create_user, check_pw } from '../user/user.query'
import jwt from 'jsonwebtoken'

const router = express.Router()

router.post('/register', async (req, res) => {
    const { email, password, name, firstname } = req.body;
    if (!(email && password && name && firstname))
        return res.status(400).json({"msg": "Bad parameter"})
    if (await email_taken(email) === true)
        return res.status(400).json({"msg": "Account already exists"})
    const hashed_password = await bcrypt.hash(password, 10)
    const userId = await create_user(email, hashed_password, name, firstname)
    const secret = process.env.SECRET
    if (!secret)
        return res.status(500).json({ msg: 'Missing SECRET' })
    const token = jwt.sign({ id: userId }, secret)
    res.json({ token })
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    let ret;
    if (!(email && password))
        return res.status(400).json({"msg": "Bad parameter"})
    if (await email_taken(email) === false)
         return res.status(400).json({"msg": "Invalid Credentials"})
    ret = await check_pw(email, password)
    if (ret === false)
         return res.status(400).json({"msg": "Invalid Credentials"})
    else {
        const secret = process.env.SECRET
        if (!secret)
            return res.status(500).json({ msg: 'Missing SECRET' })
        const token = jwt.sign({ id: ret }, secret)
        return res.status(200).json({"token": token})
    }
})

export default router
