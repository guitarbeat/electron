import { supabase } from '../../integrations/supabase/client.ts';

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeminiResponse {
  message: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
}

/**
 * Calls the Gemini AI model through Supabase Edge Function
 */
export const callGemini = async (messages: GeminiMessage[]): Promise<GeminiResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { messages }
    });

    if (error) {
      throw new Error(`Gemini service error: ${error.message}`);
    }

    return data as GeminiResponse;
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw error;
  }
};

/**
 * Processes a user message and extracts tool calls from AI response
 */
export const processUserMessage = async (userMessage: string): Promise<GeminiResponse> => {
  const messages: GeminiMessage[] = [
    { role: 'user', content: userMessage }
  ];

  const response = await callGemini(messages);
  
  // Parse tool calls from response if present
  if (response.message.includes('tool_call:')) {
    // Extract tool calls logic here
    const toolCallMatch = response.message.match(/tool_call:\s*(\w+)\s*(.*)/);
    if (toolCallMatch) {
      const [, toolName, argsString] = toolCallMatch;
      try {
        const toolArgs = JSON.parse(argsString);
        response.toolCalls = [{ name: toolName, arguments: toolArgs }];
      } catch (e) {
        console.warn('Failed to parse tool arguments:', e);
      }
    }
  }

  return response;
};
