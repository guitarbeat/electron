import re

with open("apps/web/src/hooks/index.ts", "r") as f:
    content = f.read()

replacement = """  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReduced.current || isDisabled.current) return;
    coordsRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (raf.current !== 0) return;

    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const el = ref.current;
      const coords = coordsRef.current;
      if (!el || !coords) return;

      const domRect = el.getBoundingClientRect();
      const r = {
        left: domRect.left,
        top: domRect.top,
        width: domRect.width || 1,
        height: domRect.height || 1,
      };

      const x = coords.clientX - r.left;"""

content = re.sub(
    r'  const onMouseMove = useCallback\(\(e: React\.MouseEvent\) => \{.*?const x = coords\.clientX - r\.left;',
    replacement,
    content,
    flags=re.DOTALL
)

with open("apps/web/src/hooks/index.ts", "w") as f:
    f.write(content)
