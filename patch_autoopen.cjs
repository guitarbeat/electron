const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/ui/PageFlip.tsx', 'utf8');

const target1 = `  forceClose?: boolean;
  className?: string;`;
const replace1 = `  forceClose?: boolean;
  autoOpen?: boolean;
  className?: string;`;
content = content.replace(target1, replace1);

const target2 = `  forceClose,
}) => {`;
const replace2 = `  forceClose,
  autoOpen,
}) => {`;
content = content.replace(target2, replace2);

const target3 = `  React.useEffect(() => {
    if (forceClose && turnedCount > 0) {
      setIsClosingAll(true);
      setTurnedCount(0);
      onPageChange?.(0);
    }
  }, [forceClose, turnedCount, onPageChange]);`;
const replace3 = `  React.useEffect(() => {
    if (forceClose && turnedCount > 0) {
      setIsClosingAll(true);
      setTurnedCount(0);
      onPageChange?.(0);
    }
  }, [forceClose, turnedCount, onPageChange]);

  React.useEffect(() => {
    if (autoOpen && turnedCount === 0 && !forceClose) {
      const t = setTimeout(() => {
        setIsClosingAll(false);
        setTurnedCount(1);
        onPageChange?.(1);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [autoOpen, forceClose, turnedCount, onPageChange]);`;
content = content.replace(target3, replace3);

fs.writeFileSync('apps/web/src/components/ui/PageFlip.tsx', content, 'utf8');
console.log("Patched PageFlip autoOpen");
