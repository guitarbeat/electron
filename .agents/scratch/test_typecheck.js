const { execSync } = require('child_process');
try {
  execSync('pnpm run typecheck:libs', { stdio: 'inherit' });
  console.log('Typecheck libs passed');
} catch (e) {
  console.error('Typecheck libs failed');
}
