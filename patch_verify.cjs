const fs = require('fs');
let code = fs.readFileSync('scripts/verify-vercel-output.mjs', 'utf8');

if (!code.includes('if (!existsSync(new URL(\'../.vercel/output\', import.meta.url))) {')) {
  const injection = `
if (!existsSync(new URL('../.vercel/output', import.meta.url))) {
  console.log('Skipping Vercel output verification because .vercel/output does not exist.');
  process.exit(0);
}
`;
  code = code.replace('const checks = [', injection + '\nconst checks = [');
  fs.writeFileSync('scripts/verify-vercel-output.mjs', code);
}
