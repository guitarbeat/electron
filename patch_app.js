const fs = require('fs');
const path = 'artifacts/electron/src/app/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// The `cursorTrailEnabled` prop is passed to RetroEffects, but the lazy loader wrapper might not have it properly typed if it's returning a default export without explicit props typing in the lazy wrapper. Wait, `React.lazy`infers the prop types from the default export.
// Let's check the error:
// `src/app/App.tsx(368,25): error TS2322: Type '{ cursorTrailEnabled: boolean; }' is not assignable to type 'IntrinsicAttributes'.`
// This usually means the module imported by React.lazy doesn't export a component that accepts this prop as default, or the type isn't correctly resolved.
// But RetroEffects.tsx DOES have `export default RetroEffects;` and `interface RetroEffectsProps { cursorTrailEnabled: boolean; }`.
// The issue is likely that `catch` in `React.lazy` returns an empty functional component, removing the props.

const lazySearch = `const RetroEffects = React.lazy(() =>
  import('@/components/effects/RetroEffects').catch(
    () => ({ default: () => null }) as unknown as Promise<{
      default: React.ComponentType;
    }>
  )
);`;

// Instead of guessing, I'll search for the lazy loader of RetroEffects in App.tsx
