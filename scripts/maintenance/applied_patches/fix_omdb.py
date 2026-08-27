import re

with open("apps/web/src/services/metadata/index.ts", "r") as f:
    content = f.read()

replacement = """export const fetchOmdbMetadata = async (
  title: string,
  type?: "movie" | "series" | "youtube",
  imdbId?: string,
  signal?: AbortSignal,
): Promise<MovieMetadata> => {
  if (type === "youtube") {
    return {
      title,
      type: "youtube",
    };
  }

  try {"""

content = re.sub(
    r'export const fetchOmdbMetadata = async \(\n  title: string,\n  type\?: "movie" \| "series" \| "youtube",\n  imdbId\?: string,\n  signal\?: AbortSignal,\n\): Promise<MovieMetadata> => \{\n  try \{',
    replacement,
    content,
    flags=re.DOTALL
)

with open("apps/web/src/services/metadata/index.ts", "w") as f:
    f.write(content)
