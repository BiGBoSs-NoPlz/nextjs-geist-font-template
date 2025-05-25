import { Request, Response, NextFunction } from 'express';
import fileUpload from 'express-fileupload';
import jwt from 'jsonwebtoken';
import { config, AllowedMimeType } from '../config';
import { User, UserDocument } from '../models/User';

// Extend the Request type but make user required after auth middleware
export interface AuthRequest extends Omit<Request, 'files'> {
  user: UserDocument;
  files?: fileUpload.FileArray;
}

// For routes that don't require authentication
export interface OptionalAuthRequest extends Omit<Request, 'files'> {
  user?: UserDocument;
  files?: fileUpload.FileArray;
}

export const auth = async (req: OptionalAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });
};

// File upload middleware
export const validateFileUpload = (req: OptionalAuthRequest, res: Response, next: NextFunction) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;

  if (file.size > config.maxFileSize) {
    return res.status(400).json({ 
      error: `File size should not exceed ${config.maxFileSize / (1024 * 1024)}MB.` 
    });
  }

  const mimetype = file.mimetype as AllowedMimeType;
  if (!config.allowedFileTypes.includes(mimetype)) {
    return res.status(400).json({ 
      error: 'Invalid file type.' 
    });
  }

  next();
  return;
};

// Socket.IO authentication middleware
export const socketAuth = async (socket: any, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token?.replace('Bearer ', '');

    if (!token) {
      throw new Error('Authentication error');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};
