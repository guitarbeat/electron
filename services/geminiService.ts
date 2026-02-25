import type { User } from '../types';
import { buildAgentContextSnapshot, getAgentCapabilities } from './agentContext';
import type { AgentToolCall } from './agentTools';
import { supabase } from '../src/integrations/supabase/client';
import { extractTextFromResponse, type GeminiResponse } from './geminiUtils';

const env = (import.meta.env || {}) as any;

const GEMINI_MODEL = env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

export interface AgentTurnInput {
  currentUser: User | null;
  message: string;
}

export interface AgentTurnOutput {
  assistantMessage: string;
  toolCalls: AgentToolCall[];
  rawText: string;
}

export const isGeminiConfigured = () => true;

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
  const prompt = await buildPrompt(currentUser, message);

  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
      model: GEMINI_MODEL,
    },
  });

  if (error) {
    throw new Error(`Gemini Proxy error: ${error.message}`);
  }

  const rawText = extractTextFromResponse(data as GeminiResponse);

  const parsed = parseAgentTurn(rawText);
  return { ...parsed, rawText };
};
