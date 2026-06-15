const fs = require('fs');
const path = 'artifacts/electron/src/app/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `const RetroEffects = React.lazy(() =>
  import('@/components/effects/RetroEffects').catch(
    () => ({ default: () => null }) as { default: React.FC }
  )
);`,
  `const RetroEffects = React.lazy(() =>
  import('@/components/effects/RetroEffects').catch(
    () => ({ default: (() => null) as React.ComponentType<any> })
  )
);`
);

content = content.replace(
  `const RadialMenu = React.lazy(() =>
  import('@/components/effects/RadialMenu').catch(
    () => ({ default: () => null }) as { default: React.FC }
  )
);`,
  `const RadialMenu = React.lazy(() =>
  import('@/components/effects/RadialMenu').catch(
    () => ({ default: (() => null) as React.ComponentType<any> })
  )
);`
);

fs.writeFileSync(path, content);
