import { Request, Response } from 'express';
import pool from "../lib/db"; // Fixed import path
import { Login, Organization } from "../lib/types"; // Fixed import path
import { decryptPassword, encryptPassword } from "../lib/incrypt"; // Fixed import path
import { generateRefreshToken, generateToken, verifyRefreshToken } from "../lib/jwt"; // Importing JWT functions

class IdentityController {
    async register(req: Request, res: Response) {
        try {
            const body = req.body as Organization;
            const { username, password, wilaya, commune, name } = body;

            if (!username || !password || !wilaya || !commune || !name) {
                return res.status(400).json({
                    success: false,
                    message: "Username, password, wilaya, commune, and name are required"
                });
            }

            // Check if username already exists
            const [existingUsers] = await pool.query<any[]>(
                'SELECT id FROM organization WHERE username = ?',
                [username]
            );

            if (Array.isArray(existingUsers) && existingUsers.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Username already exists"
                });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters long"
                });
            }

            // Validate wilaya and commune format
            if (!/^[a-zA-Z\s]{2,}$/.test(wilaya) || !/^[a-zA-Z\s]{2,}$/.test(commune)) {
                return res.status(400).json({
                    success: false,
                    message: "Wilaya and commune must contain only letters and spaces, minimum 2 characters"
                });
            }

            // Validate organization name
            if (name.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Organization name must be at least 3 characters long"
                });
            }

            const encryptedPassword = encryptPassword(password);

            // Insert the new organization into the database
            await pool.query('INSERT INTO organization (username, password, wilaya, commune, name) VALUES (?, ?, ?, ?, ?)', 
                [username, encryptedPassword, wilaya, commune, name]);

            return res.status(201).json({
                success: true,
                message: "Organization registered successfully"
            });
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific database errors
            if (error instanceof Error) {
                if (error.message.includes('Duplicate entry')) {
                    return res.status(409).json({
                        success: false,
                        message: "Username already exists"
                    });
                }
            }

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const body = req.body as Login; // Removed unnecessary unknown assertion
            const { username, password } = body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Username and password are required"
                });
            }

            const [rows] = await pool.query<any[]>(
                'SELECT id, username, wilaya, commune, name, password FROM organization WHERE username = ?',
                [username]
            );

            if (!Array.isArray(rows) || rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            const user = rows[0];

            // Verify the password
            if (decryptPassword(user.password) !== password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            // Generate JWT token
            const token = generateToken({
                id: user.id,
                username: user.username,
                wilaya: user.wilaya,
                commune: user.commune,
                name: user.name,
                password: user.password,
                created_at: new Date(),
                updated_at: new Date()
            });
            const refreshToken = generateRefreshToken({
                id: user.id,
                username: user.username,
                wilaya: user.wilaya,
                commune: user.commune,
                name: user.name,
                password: user.password,
                created_at: new Date(),
                updated_at: new Date()
            });

            return res.status(200).json({
                success: true,
                user: { id: user.id, username: user.username, wilaya: user.wilaya, commune: user.commune, name: user.name },
                token,
                refreshToken
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.body.refreshToken;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Refresh token is required"
                });
            }

            const decoded = await verifyRefreshToken(refreshToken);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid refresh token"
                });
            }

            // Get user data from database to ensure token has all required Organization fields
            const [rows] = await pool.query<any[]>(
                'SELECT id, username, wilaya, commune, name, password FROM organization WHERE id = ?',
                [decoded.id]
            );

            if (!Array.isArray(rows) || rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            const user = rows[0];
            const token = generateToken({
                id: user.id,
                username: user.username,
                wilaya: user.wilaya,
                commune: user.commune,
                name: user.name,
                password: user.password,
                created_at: new Date(),
                updated_at: new Date()
            });

            return res.status(200).json({ token });
        } catch (error) {
            console.error('Refresh token error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async logout(_req: Request, res: Response) {
        // For now just return success since we don't maintain token blacklist
        return res.status(200).json({ 
            success: true,
            message: "Logout successful" 
        });
    }

    async update(req: Request, res: Response) {
        try {
            const body = req.body as Organization;
            const { username, password, wilaya, commune, name } = body;
            const userId = req.body.id; // Get user ID from request

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            // Build update query dynamically based on provided fields
            const updates: string[] = [];
            const values: any[] = [];

            if (username) {
                updates.push('username = ?');
                values.push(username);
            }
            if (password) {
                updates.push('password = ?');
                values.push(encryptPassword(password));
            }
            if (wilaya) {
                updates.push('wilaya = ?');
                values.push(wilaya);
            }
            if (commune) {
                updates.push('commune = ?');
                values.push(commune);
            }
            if (name) {
                updates.push('name = ?');
                values.push(name);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No fields to update"
                });
            }

            values.push(userId);
            const updateQuery = `UPDATE organization SET ${updates.join(', ')} WHERE id = ?`;

            await pool.query(updateQuery, values);

            return res.status(200).json({
                success: true,
                message: "Organization updated successfully"
            });

        } catch (error) {
            console.error('Update error:', error);
            return res.status(500).json({
                success: false, 
                message: "Internal server error"
            });
        }
    }
}

export default new IdentityController();