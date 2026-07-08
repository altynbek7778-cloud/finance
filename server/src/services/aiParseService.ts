import Anthropic from '@anthropic-ai/sdk';
import { aiParseResultSchema, type AiParseResult } from '@adel/shared';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logEvent } from './auditService.js';

const MODEL = 'claude-haiku-4-5-20251001';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, 'AI parsing is not configured on this server');
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new HttpError(502, 'AI response was not valid JSON');
  }
}

export async function parseTransactionText(
  workspaceId: string,
  userId: string,
  text: string
): Promise<AiParseResult> {
  const categories = await prisma.category.findMany({
    where: { workspaceId, isArchived: false },
    select: { id: true, name: true, type: true },
  });
  if (categories.length === 0) throw new HttpError(400, 'Workspace has no categories yet');

  const catList = categories.map((c) => `${c.id}: ${c.name} (${c.type})`).join(', ');
  const prompt = `Разбери финансовую операцию. Верни ТОЛЬКО JSON без markdown, без пояснений.
Текст: "${text}"
Категории: ${catList}
JSON формат: {"type":"EXPENSE"|"INCOME","amount":число_тенге,"categoryId":"идентификатор","desc":"описание на русском"}`;

  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
  const parsedJson = extractJson(rawText);
  const result = aiParseResultSchema.safeParse(parsedJson);
  if (!result.success) throw new HttpError(502, 'AI response did not match the expected shape');

  let { categoryId } = result.data;
  const matchedCategory = categories.find((c) => c.id === categoryId && c.type === result.data.type);
  if (!matchedCategory) {
    const fallback = categories.find((c) => c.type === result.data.type);
    if (!fallback) throw new HttpError(400, `No ${result.data.type} category available in this workspace`);
    categoryId = fallback.id;
  }

  await logEvent({
    actorType: 'USER',
    action: 'ai.parse_transaction',
    userId,
    workspaceId,
    metadata: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  });

  return { ...result.data, categoryId };
}
