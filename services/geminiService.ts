import type { User } from '../types';
import { buildAgentContextSnapshot, getAgentCapabilities } from './agentContext';
import type { AgentToolCall } from './agentTools';

const env = (import.meta.env || {}) as any;

const GEMINI_API_KEY = env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_BASE_URL =
  env.VITE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

export interface AgentTurnInput {
  currentUser: User | null;
  message: string;
}

export interface AgentTurnOutput {
  assistantMessage: string;
  toolCalls: AgentToolCall[];
  rawText: string;
}

export const isGeminiConfigured = () => Boolean(GEMINI_API_KEY);

const extractJson = (text: string): string | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return null;
  return text.slice(start, end + 1);
};

const parseAgentTurn = (
  rawText: string
): { assistantMessage: string; toolCalls: AgentToolCall[] } => {
  const trimmed = rawText.trim();
  const candidate = trimmed.startsWith('{') ? trimmed : extractJson(trimmed);
  if (!candidate) {
    return { assistantMessage: trimmed, toolCalls: [] };
  }

  try {
    const parsed = JSON.parse(candidate);
    const assistantMessage =
      typeof parsed?.assistantMessage === 'string' ? parsed.assistantMessage : trimmed;
    const toolCalls = Array.isArray(parsed?.toolCalls) ? (parsed.toolCalls as AgentToolCall[]) : [];
    return { assistantMessage, toolCalls };
  } catch {
    return { assistantMessage: trimmed, toolCalls: [] };
  }
};

const buildPrompt = async (currentUser: User | null, userMessage: string) => {
  const [context, capabilities] = await Promise.all([
    buildAgentContextSnapshot(currentUser),
    Promise.resolve(getAgentCapabilities()),
  ]);

  return [
    `You are an assistant embedded in a private movie watchlist web app used by Aaron & Electra.`,
    `You can take actions by calling tools. You MUST respond with a single JSON object, no markdown fences.`,
    ``,
    `Response JSON schema:`,
    `{`,
    `  "assistantMessage": string,`,
    `  "toolCalls": [`,
    `    { "id": string, "name": string, "args": object }`,
    `  ]`,
    `}`,
    ``,
    `Rules:`,
    `- If no tools are needed, return toolCalls: []`,
    `- Prefer small, safe changes (one or a few toolCalls)`,
    `- Never invent IDs. Use IDs from context if you need to reference items`,
    `- If the user asks for something ambiguous, ask a question in assistantMessage and do not call tools`,
    ``,
    `Available tools:`,
    JSON.stringify(capabilities, null, 2),
    ``,
    `Current context snapshot:`,
    JSON.stringify(context, null, 2),
    ``,
    `User message:`,
    userMessage,
  ].join('\n');
};

export const runAgentTurn = async ({
  currentUser,
  message,
}: AgentTurnInput): Promise<AgentTurnOutput> => {
  if (!GEMINI_API_KEY) {
    return {
      assistantMessage:
        'Agent is not configured. Set VITE_GEMINI_API_KEY (and optionally VITE_GEMINI_MODEL) in your .env and reload.',
      toolCalls: [],
      rawText: '',
    };
  }

  const prompt = await buildPrompt(currentUser, message);
  const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    let details = '';
    try {
      details = JSON.stringify(await response.json());
    } catch {
      details = await response.text();
    }
    throw new Error(`Gemini API error (${response.status}): ${details}`);
  }

  const json = await response.json();
  const rawText =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text)
      .filter(Boolean)
      .join('\n') || '';

  const parsed = parseAgentTurn(rawText);
  return { ...parsed, rawText };
};
