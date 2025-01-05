import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const algorithm = 'aes-256-cbc';
const key = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
const iv = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');

export const encryptPassword = (password: string): string => {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};


export const saveKeyToFile = (filePath: string): void => {
    fs.writeFileSync(path.resolve(filePath), key.toString('hex'));
};

export const loadKeyFromFile = (filePath: string): Buffer => {
    const keyHex = fs.readFileSync(path.resolve(filePath), 'utf8');
    return Buffer.from(keyHex, 'hex');
};
