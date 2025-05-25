import express, { Router, RequestHandler, Response } from 'express';
import {
  getMessages,
  sendMessage,
  deleteMessage
} from '../controllers/message.controller';
import { auth, AuthRequest, validateFileUpload } from '../middleware/auth';

const router: Router = express.Router();

// Type for route handlers that use AuthRequest
type AuthHandler = (req: AuthRequest, res: Response) => Promise<any>;

// Convert AuthHandler to RequestHandler
const asHandler = (handler: AuthHandler): RequestHandler => {
  return (req, res, next) => {
    return Promise.resolve(handler(req as AuthRequest, res)).catch(next);
  };
};

// All message routes require authentication
router.use(auth as RequestHandler);

// Apply type conversions to route handlers
router.get('/:chatId', asHandler(getMessages));
router.post('/:chatId', validateFileUpload as RequestHandler, asHandler(sendMessage));
router.delete('/:messageId', asHandler(deleteMessage));

export default router;
