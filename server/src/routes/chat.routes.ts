import express, { Router, RequestHandler, Response } from 'express';
import { 
  getChats, 
  createPrivateChat, 
  createGroupChat, 
  getChatById 
} from '../controllers/chat.controller';
import { auth, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Type for route handlers that use AuthRequest
type AuthHandler = (req: AuthRequest, res: Response) => Promise<any>;

// Convert AuthHandler to RequestHandler
const asHandler = (handler: AuthHandler): RequestHandler => {
  return (req, res, next) => {
    return Promise.resolve(handler(req as AuthRequest, res)).catch(next);
  };
};

// All chat routes require authentication
router.use(auth as RequestHandler);

// Apply type conversions to route handlers
router.get('/', asHandler(getChats));
router.post('/private', asHandler(createPrivateChat));
router.post('/group', asHandler(createGroupChat));
router.get('/:id', asHandler(getChatById));

export default router;
