const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/ui/PageFlip.tsx', 'utf8');

const target1 = `  className?: string;`;
const replace1 = `  forceClose?: boolean;\n  className?: string;`;
content = content.replace(target1, replace1);

const target2 = `  onBackgroundClick,
}) => {
  const total = pages.length;`;
const replace2 = `  onBackgroundClick,
  forceClose,
}) => {
  const total = pages.length;`;
content = content.replace(target2, replace2);

const target3 = `  const [isClosingAll, setIsClosingAll] = useState(false);
  const curve = EASINGS[ease] ?? EASINGS.easeInOut;`;
const replace3 = `  const [isClosingAll, setIsClosingAll] = useState(false);
  const curve = EASINGS[ease] ?? EASINGS.easeInOut;

  React.useEffect(() => {
    if (forceClose && turnedCount > 0) {
      setIsClosingAll(true);
      setTurnedCount(0);
      onPageChange?.(0);
    }
  }, [forceClose, turnedCount, onPageChange]);`;
content = content.replace(target3, replace3);

fs.writeFileSync('apps/web/src/components/ui/PageFlip.tsx', content, 'utf8');
console.log("Patched PageFlip.tsx");
