import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Login, Organization } from "../lib/types";
import { encryptPassword } from "../lib/incrypt";
import { generateRefreshToken, generateToken, verifyRefreshToken } from "../lib/jwt";

const prisma = new PrismaClient();

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
            const existingUser = await prisma.organization.findUnique({
                where: { username }
            });

            if (existingUser) {
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

            // Create new organization using Prisma
            await prisma.organization.create({
                data: {
                    username,
                    password: encryptedPassword,
                    wilaya,
                    commune,
                    name,
                }
            });

            return res.status(201).json({
                success: true,
                message: "Organization registered successfully"
            });
        } catch (error) {
            console.error('Registration error:', error);
            console.log('Error details:', error); // Log the error details

            if (error instanceof Error) {
                if (error.message.includes('Unique constraint')) {
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
            const body = req.body as Login;
            const { username, password } = body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Username and password are required"
                });
            }

            const user = await prisma.organization.findUnique({
                where: { username }
            });



            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }
            if (!user.isactive) {
                return res.status(401).json({
                    success: false,
                    message: "User is not active"
                });
            }

            // Verify the password
            if (encryptPassword(password) !== user.password) {
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
                created_at: user.created_at,
                updated_at: user.updated_at
            });
            const refreshToken = generateRefreshToken({
                id: user.id,
                username: user.username,
                wilaya: user.wilaya,
                commune: user.commune,
                name: user.name,
                password: user.password,
                created_at: user.created_at,
                updated_at: user.updated_at
            });
            console.log(user);
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

            const user = await prisma.organization.findUnique({
                where: { id: decoded.id }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            const token = generateToken({
                id: user.id,
                username: user.username,
                wilaya: user.wilaya,
                commune: user.commune,
                name: user.name,
                password: user.password,
                created_at: user.created_at,
                updated_at: user.updated_at
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
            const userId = req.body.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            // Build update data object
            const updateData: any = {};

            if (username) updateData.username = username;
            if (password) updateData.password = encryptPassword(password);
            if (wilaya) updateData.wilaya = wilaya;
            if (commune) updateData.commune = commune;
            if (name) updateData.name = name;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No fields to update"
                });
            }

            await prisma.organization.update({
                where: { id: userId },
                data: updateData
            });

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