import { saveDailySpin } from './services/dailySpinService';

// Mock globals
const globalAny: any = global;

// Mock fetch
const fetchMock = async (url: string, options: any = {}) => {
  if (options.method === 'PATCH') {
    const body = JSON.parse(options.body);
    const files = Object.keys(body.files);
    console.log('PATCH files:', files);
    if (files.length > 1) {
      console.log('FAIL: More than one file being updated!');
    } else if (files.length === 1 && files[0] === 'dailyspin.json') {
      console.log('PASS: Only dailyspin.json is being updated.');
    } else {
      console.log('FAIL: Unexpected file update:', files);
    }
    return {
      ok: true,
      json: async () => ({}),
    };
  } else {
    // GET request (mocking the initial fetch in saveDailySpin)
    return {
      ok: true,
      json: async () => ({
        files: {
          'dailyspin.json': { content: '{}' },
          'movielist.json': { content: '[]' },
          'messages.json': { content: '[]' },
        },
      }),
    };
  }
};

globalAny.fetch = fetchMock;

// Mock console.error to avoid noise
globalAny.console = {
  ...console,
  error: () => {},
};

async function run() {
  console.log('Running reproduction test...');
  try {
    await saveDailySpin({
      date: '2023-10-27',
      movieId: '123',
      movieTitle: 'Test Movie',
      spunBy: 'Aaron',
      createdAt: '2023-10-27T00:00:00Z',
    });
  } catch (e) {
    console.log('Error during execution:', e);
  }
}

run();
