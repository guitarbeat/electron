const { execSync } = require('child_process');

try {
  const result = execSync('VITE_GIST_TOKEN=test_token VITE_GIST_ID=test_id pnpm run test:all', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log(error.stdout);
}
