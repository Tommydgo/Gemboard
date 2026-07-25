import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

function auth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (!authHeader)
        return res.status(401).json({ msg: 'No token, authorization denied' })
    const token = authHeader.split(' ')[1]
    if (!token)
        return res.status(401).json({ msg: 'No token, authorization denied' })
    const secret = process.env.SECRET
    if (!secret)
        return res.status(500).json({ msg: 'Internal server error' })
    try {
        const decoded = jwt.verify(token, secret)
        res.locals.user = decoded;
        next()
    } catch {
        return res.status(401).json({ msg: 'Token is not valid' })
    }
}

export default auth
