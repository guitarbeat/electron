const fs = require('fs');
const path = 'config/gistConfig.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Security: Never hardcode tokens')) {
  code = code.replace(
    /const GIST_TOKEN = clean\(env\.VITE_GIST_TOKEN \|\| ''\); \/\/ Must be set in \.env/,
    `// Security: Never hardcode tokens here. They must be injected via environment variables.\nconst GIST_TOKEN = clean(env.VITE_GIST_TOKEN || ''); // Must be set in .env`
  );
  fs.writeFileSync(path, code);
  console.log('Patched config/gistConfig.ts');
}
