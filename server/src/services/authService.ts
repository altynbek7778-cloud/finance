import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  REFRESH_TOKEN_TTL_MS,
} from '../lib/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';
import type { RegisterInput, LoginInput } from '@adel/shared';

const AVATAR_COLORS = ['#a78bfa', '#4ade80', '#38bdf8', '#f97316', '#f472b6', '#facc15'];

function pickAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
}

async function issueTokens(userId: string, device: DeviceInfo) {
  const accessToken = signAccessToken(userId);
  const { raw, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      userAgent: device.userAgent,
      ipAddress: device.ipAddress,
    },
  });
  return { accessToken, refreshToken: raw };
}

export async function registerUser(input: RegisterInput, device: DeviceInfo) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      avatarColor: pickAvatarColor(),
    },
  });

  const tokens = await issueTokens(user.id, device);
  return { user, ...tokens };
}

export async function loginUser(input: LoginInput, device: DeviceInfo) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, 'Invalid email or password');
  if (user.isDisabled) throw new HttpError(403, 'This account has been disabled');

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid email or password');

  const tokens = await issueTokens(user.id, device);
  return { user, ...tokens };
}

export async function rotateRefreshToken(rawToken: string, device: DeviceInfo) {
  const hash = hashRefreshToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!existing) throw new HttpError(401, 'Invalid session');

  if (existing.revokedAt) {
    // Reuse of a revoked/rotated token is a theft signal: revoke the whole chain for this user.
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, 'Session invalidated, please log in again');
  }

  if (existing.expiresAt < new Date()) {
    throw new HttpError(401, 'Session expired, please log in again');
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user || user.isDisabled) throw new HttpError(401, 'Account not available');

  const { raw, hash: newHash } = generateRefreshToken();
  const newToken = await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
      },
    });
    await tx.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: created.id },
    });
    return created;
  });

  const accessToken = signAccessToken(user.id);
  return { accessToken, refreshToken: raw, user };
}

export async function revokeRefreshToken(rawToken: string) {
  const hash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserWithWorkspaces(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });
  return {
    user,
    workspaces: memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role })),
  };
}
