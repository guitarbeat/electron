import fs from 'fs';
let config = fs.readFileSync('eslint.config.js', 'utf8');

// Add the import
config = config.replace(
  "import jsxA11y from 'eslint-plugin-jsx-a11y';",
  "import jsxA11y from 'eslint-plugin-jsx-a11y';\nimport unusedImports from 'eslint-plugin-unused-imports';"
);

// Add the plugin
config = config.replace(
  "'react-refresh': reactRefresh,",
  "'react-refresh': reactRefresh,\n      'unused-imports': unusedImports,"
);

// Replace the rule
config = config.replace(
  /'@typescript-eslint\/no-unused-vars': \[\s*'warn',\s*\{ argsIgnorePattern: '\^_', varsIgnorePattern: '\^_' \},\s*\],/,
  "'@typescript-eslint/no-unused-vars': 'off',\n      'unused-imports/no-unused-imports': 'warn',\n      'unused-imports/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }],"
);

fs.writeFileSync('eslint.config.js', config);
