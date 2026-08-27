import re

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "r") as f:
    content = f.read()

new_skeleton = """  const skeletonItems = Array.from({ length: skeletonCount }, (_, i) => {
    const isShort = i % 5 === 2;
    return (
    <div
      key={`loading-tile-${i}`}
      className="drift-wall-loading__tile"
      data-height-ratio={isShort ? 0.55 : 1}
      style={
        {
          "--loading-tile": Math.floor(i / (isMobile ? 3 : 8)),
          "--loading-column": i % (isMobile ? 3 : 8),
          "--loading-tone": i % 6,
          width: "100%",
          height: "100%",
        } as React.CSSProperties
      }
    />
  )});"""

content = re.sub(
    r'  const skeletonItems = Array\.from\(\{ length: skeletonCount \}, \(_, i\) => \(\n    <div\n      key={`loading-tile-\$\{i\}`}\n      className="drift-wall-loading__tile"\n      style=\{\n        \{\n          "--loading-tile": Math\.floor\(i / \(isMobile \? 3 : 8\)\),\n          "--loading-column": i % \(isMobile \? 3 : 8\),\n          "--loading-tone": i % 6,\n          width: "100%",\n          height: "100%",\n        \} as React\.CSSProperties\n      \}\n    />\n  \)\);',
    new_skeleton.strip(),
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "w") as f:
    f.write(content)
