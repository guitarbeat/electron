const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/ui/PageFlip.tsx', 'utf8');

const target = `  React.useEffect(() => {
    if (autoOpen && turnedCount === 0 && !forceClose) {
      const t = setTimeout(() => {
        setIsClosingAll(false);
        setTurnedCount(1);
        onPageChange?.(1);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [autoOpen, forceClose, turnedCount, onPageChange]);`;

const replacement = `  React.useEffect(() => {
    if (autoOpen && turnedCount === 0 && !forceClose) {
      const t = setTimeout(() => {
        setIsClosingAll(false);
        setTurnedCount(1);
        onPageChange?.(1);
      }, 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoOpen, forceClose, turnedCount, onPageChange]);`;

content = content.replace(target, replacement);
fs.writeFileSync('apps/web/src/components/ui/PageFlip.tsx', content, 'utf8');
console.log("Patched effect return");
