import re

with open("apps/web/src/components/ui/DriftWall.tsx", "r") as f:
    content = f.read()

# 1. Add refs at the top level
content = content.replace(
    'const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });',
    'const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });\n  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });\n  const hasDraggedRef = useRef<boolean>(false);'
)

# 2. Clean up the messy replace inside useEffect
content = content.replace(
    '''    let touchStartPos = { x: 0, y: 0 };
    let hasDragged = false;
    
    // We can expose hasDragged to the global window or to the component instance via ref,
    // but a cleaner way is just a ref defined at the top of the component.
    // Actually, I will just remove this block and put the refs at the top.
''',
    ''
)

with open("apps/web/src/components/ui/DriftWall.tsx", "w") as f:
    f.write(content)

