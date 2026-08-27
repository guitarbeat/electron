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
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), z-index 0.4s step-start;
  z-index: 1;
}

.drift-wall__tile-custom:hover,
.drift-wall__tile-custom:focus-within {
  transform: translateZ(1px);
  z-index: 50;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), z-index 0s step-start;
}"""

content = re.sub(
    r'/\* Custom interactive children / movie cards inside tiles \*/\n\.drift-wall__tile-custom \{.*?step-start;\n\}',
    replacement,
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/ui/DriftWall.css", "w") as f:
    f.write(content)
