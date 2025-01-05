import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { Organization } from './types';

config(); // Load environment variables from .env file

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

const secretKey = process.env.JWT_SECRET;

export const generateToken = (user: Organization): string => {
    const payload = {
        id: user.id,
        username: user.username,
        wilaya: user.wilaya,
        commune: user.commune,
        name: user.name
    };
    const options = { expiresIn: '1h' };
    return jwt.sign(payload, secretKey, options);
};

export const verifyToken = (token: string): Promise<Organization> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                console.error('Token verification error:', err);
                return reject(new Error('Invalid token'));
            }
            if (!decoded) {
                return reject(new Error('Token not decoded'));
            }
            resolve(decoded as Organization);
        });
    });
};

export const generateRefreshToken = (user: Organization): string => {
    const payload = {
        id: user.id,
        username: user.username,
        wilaya: user.wilaya,
        commune: user.commune,
        name: user.name
    };
    const options = { expiresIn: '7d' };
    return jwt.sign(payload, secretKey, options);
};

export const verifyRefreshToken = (token: string): Promise<Organization> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                console.error('Refresh token verification error:', err);
                return reject(new Error('Invalid refresh token'));
            }
            if (!decoded) {
                return reject(new Error('Refresh token not decoded'));
            }
            resolve(decoded as Organization);
        });
    });
};
