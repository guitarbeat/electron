import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

# Update columnMeta calculation
new_column_meta = """  const columnMeta = useMemo(() => {
    return columnItems.map((col) => {
      let colHeight = 0;
      col.forEach((item) => {
        let hr = 1;
        if (React.isValidElement(item)) {
          if (item.props && 'data-height-ratio' in item.props) {
            hr = Number(item.props['data-height-ratio']) || 1;
          }
        } else if (item && typeof item === "object" && 'heightRatio' in item) {
          hr = Number((item as any).heightRatio) || 1;
        }
        colHeight += (tileHeight * hr) + gap;
      });
      const copyHeight = Math.max(tileHeight + gap, colHeight);
      const copies = Math.max(
        2,
        Math.ceil((containerHeight * 1.6) / copyHeight) + 1,
      );
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);"""

content = re.sub(
    r'  const columnMeta = useMemo\(\(\) => \{.*?\n      return \{ copyHeight, copies \};\n    \}\);\n  \}, \[columnItems, tileHeight, gap, containerHeight\]\);',
    new_column_meta,
    content,
    flags=re.DOTALL
)

# Update renderTile
new_render_tile_custom = """    if (
      React.isValidElement(item) ||
      (item && typeof item === "object" && "node" in item && item.node)
    ) {
      const nodeToRender = React.isValidElement(item)
        ? item
        : (item as DriftWallItem).node;
        
      let hr = 1;
      if (React.isValidElement(item)) {
        if (item.props && 'data-height-ratio' in item.props) {
          hr = Number(item.props['data-height-ratio']) || 1;
        }
      } else if (item && typeof item === "object" && 'heightRatio' in item) {
        hr = Number((item as any).heightRatio) || 1;
      }

      return (
        <div
          key={id}
          role={onTileClick ? "button" : undefined}
          tabIndex={onTileClick ? 0 : undefined}
          className={`drift-wall__tile-custom${activeId === id ? " is-active" : ""}`}
          data-tile-id={id}
          data-col={colIndex}
          style={{ "--dw-custom-h": `${tileHeight * hr}px` } as React.CSSProperties}
          onFocus={() => activate(id, colIndex)}
          onBlur={release}
          onClick={
            onTileClick ? () => onTileClick(item, originalIndex) : undefined
          }
          onKeyDown={
            onTileClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTileClick(item, originalIndex);
                  }
                }
              : undefined
          }
        >
          {nodeToRender}
        </div>
      );
    }"""

content = re.sub(
    r'    if \(\n      React\.isValidElement\(item\).*?\{nodeToRender\}\n        </div>\n      \);\n    \}',
    new_render_tile_custom,
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)
