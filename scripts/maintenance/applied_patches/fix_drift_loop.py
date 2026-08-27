import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

replacement = """          // 4. Wrap around for infinite scrolling (modulo by the column's total repeated height)
          const el = trackRefs.current[c];
          let actualCopyHeight = meta.copyHeight;
          if (el && meta.copies > 0) {
             actualCopyHeight = el.scrollHeight / meta.copies;
          }
          next = ((next % actualCopyHeight) + actualCopyHeight) % actualCopyHeight;
          offsetsRef.current[c] = next;

          // 5. Apply the transform
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;"""

content = re.sub(
    r'          // 4\. Wrap around for infinite scrolling \(modulo by the column\'s total repeated height\)\n          next = \(\(next % meta\.copyHeight\) \+ meta\.copyHeight\) % meta\.copyHeight;\n          offsetsRef\.current\[c\] = next;\n\n          // 5\. Apply the transform\n          const el = trackRefs\.current\[c\];\n          if \(el\) el\.style\.transform = `translate3d\(0, \$\{-next\}px, 0\>`;',
    replacement,
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)
