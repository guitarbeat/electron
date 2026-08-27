import re

with open("apps/web/src/components/ui/DriftWall.css", "r") as f:
    content = f.read()

replacement = """/* Custom interactive children / movie cards inside tiles */
.drift-wall__tile-custom {
  position: relative;
  display: block;
  width: 100%;
  height: calc(var(--dw-custom-h, var(--dw-tile-h)) + var(--dw-gap));
  padding: calc(var(--dw-gap) / 2);
  box-sizing: border-box;
  flex: 0 0 auto;
  transform-style: preserve-3d;
  opacity: 1;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}"""

content = re.sub(
    r'/\* Custom interactive children / movie cards inside tiles \*/\n\.drift-wall__tile-custom \{.*?step-start;\n\}',
    replacement,
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/ui/DriftWall.css", "w") as f:
    f.write(content)
