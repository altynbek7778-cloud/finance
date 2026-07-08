import type { NextFunction, Request, Response } from 'express';
import { verifyAdminToken } from '../lib/jwt.js';
import { HttpError } from './errorHandler.js';

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');
    const payload = verifyAdminToken(header.slice('Bearer '.length));
    req.adminId = payload.sub;
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(new HttpError(401, 'Invalid or expired admin token'));
  }
}
