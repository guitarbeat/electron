const fs = require('fs');
const postcss = require('postcss');

const unusedClassesFile = fs.readFileSync('unused_classes.txt', 'utf8');
const unusedClasses = new Set(
  unusedClassesFile.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(cls => '.' + cls)
);

const cssFile = 'apps/web/src/app/component-styles.css';
const css = fs.readFileSync(cssFile, 'utf8');

const plugin = postcss.plugin('purge-unused', () => {
  return (root) => {
    root.walkRules(rule => {
      // Split selectors (e.g. ".a, .b")
      const selectors = rule.selectors.filter(sel => {
        // We only want to remove it if it strictly matches one of the unused classes
        // Note: A selector might be `.app-header__menu-action:hover` or `.app-header__menu-action .child`
        // We will remove the selector if it contains the unused class as the main part.
        // Let's just check if any unused class is in the selector:
        return !Array.from(unusedClasses).some(unused => {
          // ensure it matches as a whole class name
          // e.g. .bento-ctrl but not .bento-ctrl-something
          const regex = new RegExp(`\\${unused}(?![\\w-])`);
          return regex.test(sel);
        });
      });

      if (selectors.length === 0) {
        rule.remove();
      } else {
        rule.selectors = selectors;
      }
    });
    
    // Cleanup empty media queries or keyframes
    root.walkAtRules(atRule => {
      if (atRule.nodes && atRule.nodes.length === 0) {
        atRule.remove();
      }
    });
  };
});

postcss([plugin]).process(css, { from: cssFile, to: cssFile }).then(result => {
  fs.writeFileSync(cssFile, result.css);
  console.log('CSS purged successfully.');
});
