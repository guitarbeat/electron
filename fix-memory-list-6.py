with open('src/components/memories/MemoryList.tsx', 'r') as f:
    content = f.read()

content = content.replace("""  // Validation for memory editing
  const validateMemoryNote = useMemo(
    () => createValidator({
      note: {
        ...CommonRules.messageContent,
        maxLength: 500,
        required: true,
      },
    }),
    []
  );""", "")

with open('src/components/memories/MemoryList.tsx', 'w') as f:
    f.write(content)
