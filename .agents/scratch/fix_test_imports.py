import os

files_to_fix = [
    "artifacts/electron/src/utils/shared.test.ts",
    "artifacts/api-server/src/electron-api/src/utils/shared.test.ts",
    ".migration-backup/src/utils/shared.test.ts"
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue

    with open(file_path, 'r') as f:
        content = f.read()

    # Add missing imports
    content = content.replace(
        "  sanitizeInput,\n} from \"./shared.ts\";",
        "  sanitizeInput,\n  encodeStorageData,\n  decodeStorageData,\n  formatMemoryTimestamp,\n} from \"./shared.ts\";"
    )

    with open(file_path, 'w') as f:
        f.write(content)

print("Done")
