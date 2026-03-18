const fs = require('fs');
const file = 'src/utils.test.ts';
let content = fs.readFileSync(file, 'utf8');

// I will restore the original file from origin/main to see what the exact issue was.
// The failure is "Found 1 blocking security issue: src/utils.test.ts:35 - https://github.com/guitarbeat/electron/pull/328#discussion_r2955634467"
