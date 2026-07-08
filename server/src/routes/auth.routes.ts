import { Router } from 'express';
import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from '@adel/shared';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
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

const REFRESH_COOKIE = 'refreshToken';

function refreshCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Web/API live on different origins in production (Cloudflare Pages + Render), so the
    // refresh cookie must be SameSite=None to survive cross-origin fetch with credentials.
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

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
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    await logEvent({ actorType: 'USER', action: 'auth.register', userId: user.id });
    res.status(201).json({ accessToken, user: toUserDTO(user) });
  })
);

router.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { user, accessToken, refreshToken } = await loginUser(req.body, deviceInfo(req));
      res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
      await logEvent({ actorType: 'USER', action: 'auth.login', userId: user.id });
      res.json({ accessToken, user: toUserDTO(user) });
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
  asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken) throw new HttpError(401, 'Missing refresh token');
    const { accessToken, refreshToken, user } = await rotateRefreshToken(rawToken, deviceInfo(req));
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ accessToken, user: toUserDTO(user) });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken) await revokeRefreshToken(rawToken);
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    res.status(204).send();
  })
);

router.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await revokeAllRefreshTokens(req.userId!);
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
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
