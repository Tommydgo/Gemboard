import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

function notFound(req: Request, res: Response, next: NextFunction) {
    res.status(404).json({ msg: 'Not found' })
}

export default notFound
