import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

export const encryptPassword = (password: string): string => {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptPassword = (hash: string): string => {
    const [ivString, encryptedText] = hash.split(':');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(ivString, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

export const saveKeyToFile = (filePath: string): void => {
    fs.writeFileSync(path.resolve(filePath), key.toString('hex'));
};

export const loadKeyFromFile = (filePath: string): Buffer => {
    const keyHex = fs.readFileSync(path.resolve(filePath), 'utf8');
    return Buffer.from(keyHex, 'hex');
};

