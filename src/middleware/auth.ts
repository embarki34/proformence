import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {


    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token is required' });
    }

    try {
        const user = await verifyToken(token);
        req.user = user;
        next();
        return;
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};