with open("apps/web/src/components/quiz/index.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'const { isMobile, viewportWidth } = useViewport();',
    'const { isMobile } = useViewport();\n  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);\n  useEffect(() => {\n    const handleResize = () => setViewportWidth(window.innerWidth);\n    window.addEventListener("resize", handleResize);\n    return () => window.removeEventListener("resize", handleResize);\n  }, []);'
)

with open("apps/web/src/components/quiz/index.tsx", "w") as f:
    f.write(content)
