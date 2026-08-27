import re

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "r") as f:
    content = f.read()

# Make sure DriftWall is imported
if 'import DriftWall' not in content:
    content = 'import DriftWall from "./DriftWall";\n' + content

new_loading = """
export const DriftWallLoading: React.FC<{
  isMobile: boolean;
  fullViewport?: boolean;
}> = ({ isMobile, fullViewport = false }) => {
  const skeletonCount = isMobile ? 15 : 40;
  const skeletonItems = Array.from({ length: skeletonCount }, (_, i) => (
    <div
      key={`loading-tile-${i}`}
      className="drift-wall-loading__tile"
      style={
        {
          "--loading-tile": i % 5,
          "--loading-tone": i % 6,
          width: "100%",
          height: "100%",
        } as React.CSSProperties
      }
    />
  ));

  return (
    <div
      className={`drift-wall-loading${fullViewport ? " drift-wall-loading--viewport" : ""}`}
      role="status"
      aria-live="polite"
      style={{
        position: "relative",
        width: "100%",
        height: fullViewport ? "100vh" : (isMobile ? "500px" : "800px"),
        overflow: "hidden",
        borderRadius: fullViewport ? 0 : (isMobile ? 12 : 24)
      }}
    >
      <span className="sr-only">Loading collection</span>
      
      <DriftWall
        items={skeletonItems}
        columns={isMobile ? 3 : 8}
        tileWidth={120}
        tileHeight={180}
        gap={isMobile ? 10 : 18}
        tilt={0}
        turn={-14}
        roll={0}
        perspective={2400}
        depth={120}
        speed={isMobile ? 25 : 42}
        direction="up"
      />

      <div className="drift-wall-loading__status" aria-hidden="true" style={{ bottom: fullViewport ? "2.5rem" : "1.5rem" }}>
        <span />
        <span />
        <span />
        <small>Loading collection</small>
      </div>
    </div>
  );
};
"""

# Replace the old DriftWallLoading
content = re.sub(r'export const DriftWallLoading: React\.FC<\{.*?\}> = \(.*?\) => \{.*?^\};', new_loading.strip(), content, flags=re.DOTALL | re.MULTILINE)

with open("apps/web/src/components/ui/TiltedPosterWall.tsx", "w") as f:
    f.write(content)

