import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ACCESS_TOKEN_TTL = '15m';
const ADMIN_TOKEN_TTL = '12h';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function signAdminToken(adminId: string): string {
  return jwt.sign({ sub: adminId, aud: 'admin' }, env.ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_TOKEN_TTL,
  });
}

export function verifyAdminToken(token: string): { sub: string } {
  return jwt.verify(token, env.ADMIN_JWT_SECRET, { audience: 'admin' }) as { sub: string };
}

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(48).toString('base64url');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function generateInviteCode(): string {
  return crypto.randomBytes(16).toString('base64url');
}
