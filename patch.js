const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/ui/PageFlip.tsx', 'utf8');

const target = `  const handleSelect = useCallback(
    (index: number) => {
      if (!interactive) return;
      setIsClosingAll(false);
      setTurnedCount((prev) => {
        const next = index < prev ? index : index + 1;
        onPageChange?.(next);
        return next;
      });
    },
    [interactive, onPageChange]
  );`;

const replacement = `  const handleSelect = useCallback(
    (index: number) => {
      if (!interactive) return;
      setIsClosingAll(false);
      setTurnedCount((prev) => {
        let next = index < prev ? index : index + 1;
        if (maxTurnCount !== undefined && next > maxTurnCount) {
          next = 0;
        }
        onPageChange?.(next);
        return next;
      });
    },
    [interactive, maxTurnCount, onPageChange]
  );`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('apps/web/src/components/ui/PageFlip.tsx', content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
