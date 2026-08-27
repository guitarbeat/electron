import re

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "r") as f:
    content = f.read()

new_skeleton = """
    unifiedCards = Array.from({ length: skeletonCount }, (_, i) => {
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
              width: "100%",
              height: "100%",
            } as React.CSSProperties
          }
        />
      );
    });
"""

content = re.sub(
    r'    unifiedCards = Array\.from\(\{ length: skeletonCount \}, \(_, i\) => \(\n      <div\n        key={`loading-tile-\$\{i\}`}\n        className="drift-wall-loading__tile"\n        style=\{\n          \{\n            "--loading-tile": Math\.floor\(i / \(isMobile \? 3 : 8\)\),\n            "--loading-column": i % \(isMobile \? 3 : 8\),\n            width: "100%",\n            height: "100%",\n          \} as React\.CSSProperties\n        \}\n      />\n    \)\);',
    new_skeleton.strip(),
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "w") as f:
    f.write(content)
