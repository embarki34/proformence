import { Request, Response } from 'express';
import pool from '../lib/db';
import { verifyToken } from '../lib/jwt';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

class WorkersController {
    async create(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            const decoded = await verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false, 
                    message: "Invalid token"
                });
            }

            const { fullname, department } = req.body;
            if (!fullname) {
                return res.status(400).json({
                    success: false,
                    message: "Fullname is required"
                });
            }

            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: "Department is required"
                });
            }

            // First check if department column exists
           

            

            const [result] = await pool.query<ResultSetHeader>(
                'INSERT INTO worker (fullname, department, organization_id) VALUES (?, ?, ?)',
                [fullname, department, decoded.id]
            );

            return res.status(201).json({
                success: true,
                message: "Worker created successfully",
                workerId: result.insertId
            });
        } catch (error) {
            console.error('Create worker error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            const decoded = await verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            const [workers] = await pool.query<RowDataPacket[]>(
                'SELECT id, fullname, total_likes, total_dislikes, created_at, updated_at FROM worker WHERE organization_id = ? AND active = TRUE',
                [decoded.id]
            );

            return res.status(200).json({
                success: true,
                workers
            });
        } catch (error) {
            console.error('Get workers error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            const decoded = await verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            const { id } = req.params;
            const [workers] = await pool.query<RowDataPacket[]>(
                'SELECT id, fullname, total_likes, total_dislikes, created_at, updated_at FROM worker WHERE id = ? AND organization_id = ? AND active = TRUE',
                [id, decoded.id]
            );

            if (!Array.isArray(workers) || workers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Worker not found"
                });
            }

            return res.status(200).json({
                success: true,
                worker: workers[0]
            });
        } catch (error) {
            console.error('Get worker error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            const decoded = await verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            const { id } = req.params;
            const { fullname } = req.body;

            if (!fullname) {
                return res.status(400).json({
                    success: false,
                    message: "Fullname is required"
                });
            }

            const [result] = await pool.query<ResultSetHeader>(
                'UPDATE worker SET fullname = ? WHERE id = ? AND organization_id = ? AND active = TRUE',
                [fullname, id, decoded.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Worker not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Worker updated successfully"
            });
        } catch (error) {
            console.error('Update worker error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No token provided"
                });
            }

            const decoded = await verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            const { id } = req.params;
            const [result] = await pool.query<ResultSetHeader>(
                'UPDATE worker SET active = FALSE WHERE id = ? AND organization_id = ?',
                [id, decoded.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Worker not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Worker deleted successfully"
            });
        } catch (error) {
            console.error('Delete worker error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}

export default new WorkersController();
