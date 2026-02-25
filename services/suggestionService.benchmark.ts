import { saveSuggestions } from './suggestionService.ts';

// Mock MovieSuggestion type locally to avoid importing types if complex
interface MovieSuggestion {
  id: string;
  title: string;
  suggestedBy: string;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Mock Suggestions Data
const generateSuggestions = (count: number): MovieSuggestion[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `suggestion-${i}`,
    title: `Movie Title ${i}`,
    suggestedBy: `User ${i}`,
    reason: `Reason ${i}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }));
};

let lastPayloadSize = 0;

// Mock global fetch
global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (init && init.body) {
    // Calculate payload size
    lastPayloadSize = Buffer.byteLength(init.body as string, 'utf8');
  }
  return {
    ok: true,
    json: async () => ({}),
  } as Response;
};

async function runBenchmark() {
  const count = 1000;
  const suggestions = generateSuggestions(count);

  console.log(`Running saveSuggestions benchmark with ${count} suggestions...`);

  const startTime = performance.now();
  await saveSuggestions(suggestions);
  const endTime = performance.now();

  console.log(`Payload size: ${lastPayloadSize} bytes`);
  console.log(`Time taken: ${(endTime - startTime).toFixed(2)}ms`);
}

runBenchmark().catch(console.error);
