import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

# 1. Update columnItems logic
old_columnItems = """  const columnItems = useMemo(() => {
    const cols: (DriftWallItem | ReactNode)[][] = Array.from(
      { length: columns },
      () => [],
    );
    safeItems.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : safeItems.slice(0, 1)));
  }, [safeItems, columns]);"""

new_columnItems = """  const columnItems = useMemo(() => {
    const cols: (DriftWallItem | ReactNode)[][] = Array.from(
      { length: columns },
      () => [],
    );
    // Distribute items until we have placed at least max(safeItems.length, columns * 3) items
    // This ensures no column is too short and items are well interleaved.
    const totalToPlace = Math.max(safeItems.length, columns * 4);
    for (let i = 0; i < totalToPlace; i++) {
        cols[i % columns].push(safeItems[i % safeItems.length]);
    }
    return cols;
  }, [safeItems, columns]);"""

content = content.replace(old_columnItems, new_columnItems)

# 2. Update copies calculation
old_copies = """      const copies = Math.max(
        2,
        Math.ceil((containerHeight * 1.6) / copyHeight) + 1,
      );"""

new_copies = """      // The track must cover the centered 200% height column plus scroll space
      const copies = Math.max(
        2,
        Math.ceil((containerHeight * 3.5) / copyHeight) + 2,
      );"""

content = content.replace(old_copies, new_copies)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)
