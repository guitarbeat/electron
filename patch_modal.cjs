const fs = require('fs');
let content = fs.readFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', 'utf8');

// Replace destructuring
content = content.replace(
  /const { dialogRef, closeButtonRef, playPop } = useModalBase\(\n    isVisible,\n    onClose,\n  \);/g,
  'const { dialogRef, closeButtonRef, playPop, close } = useModalBase(\n    isVisible,\n    onClose,\n  );'
);

// Replace onCloseRef.current() in Escape handler
content = content.replace(
  /onCloseRef\.current\(\);/g,
  'close();'
);

// Replace onClick={onClose} with onClick={close}
content = content.replace(
  /onClick=\{onClose\}/g,
  'onClick={close}'
);

// Replace e.currentTarget) onClose(); with e.currentTarget) close();
content = content.replace(
  /if \(e\.target === e\.currentTarget\) onClose\(\);/g,
  'if (e.target === e.currentTarget) close();'
);

// We need to pass close to PosterHero since it has onClose
content = content.replace(
  /onClose=\{onClose\}/g,
  'onClose={close}'
);

fs.writeFileSync('apps/web/src/components/movies/MovieDetailsModal.tsx', content, 'utf8');
console.log("Patched MovieDetailsModal");
