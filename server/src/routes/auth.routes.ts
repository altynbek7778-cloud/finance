import { Router } from 'express';
import type { Request, Response } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '@adel/shared';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logEvent } from '../services/auditService.js';
import {
  registerUser,
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  getUserWithWorkspaces,
} from '../services/authService.js';

const router = Router();

function deviceInfo(req: Request) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

function toUserDTO(user: { id: string; email: string; name: string; avatarColor: string | null }) {
  return { id: user.id, email: user.email, name: user.name, avatarColor: user.avatarColor };
}

router.post(
  '/register',
  authRateLimit,
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await registerUser(req.body, deviceInfo(req));
    await logEvent({ actorType: 'USER', action: 'auth.register', userId: user.id });
    res.status(201).json({ accessToken, refreshToken, user: toUserDTO(user) });
  })
);

router.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { user, accessToken, refreshToken } = await loginUser(req.body, deviceInfo(req));
      await logEvent({ actorType: 'USER', action: 'auth.login', userId: user.id });
      res.json({ accessToken, refreshToken, user: toUserDTO(user) });
    } catch (err) {
      await logEvent({
        actorType: 'USER',
        action: 'auth.login_failed',
        level: 'WARN',
        metadata: { email: req.body?.email, ip: req.ip },
      });
      throw err;
    }
  })
);

router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await rotateRefreshToken(req.body.refreshToken, deviceInfo(req));
    res.json({ accessToken, refreshToken, user: toUserDTO(user) });
  })
);

router.post(
  '/logout',
  validateBody(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await revokeRefreshToken(req.body.refreshToken);
    res.status(204).send();
  })
);

router.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await revokeAllRefreshTokens(req.userId!);
    res.status(204).send();
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { user, workspaces } = await getUserWithWorkspaces(req.userId!);
    res.json({ user: toUserDTO(user), workspaces });
  })
);

export default router;
