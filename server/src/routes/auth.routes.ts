import express, { Router, RequestHandler } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { auth, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Type assertion helper for request handlers
const asHandler = (handler: RequestHandler): RequestHandler => handler;

// Public routes
router.post('/register', asHandler(register));
router.post('/login', asHandler(login));

// Protected routes
router.post(
  '/logout',
  auth as RequestHandler,
  // After auth middleware, we know req will have user property
  (req, res) => logout(req as AuthRequest, res)
);

export default router;
