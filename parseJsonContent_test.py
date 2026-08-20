import re

file_path = 'artifacts/electron/src/utils/shared.test.ts'
with open(file_path, 'r') as f:
    content = f.read()

test_addition = """
  await t.test("throws an error when JSON.parse throws a non-SyntaxError", () => {
    assert.throws(
      () => parseJsonContent(undefined as any, "TestContext"),
      (err) => {
        return (
          err instanceof Error &&
          err.message === "Failed to parse TestContext JSON." &&
          !(err.cause instanceof SyntaxError)
        );
      },
    );
  });
"""

modified_content = content.replace(
    """    );
  });
});""",
    """    );
  });""" + test_addition + "});"
)

with open(file_path, 'w') as f:
    f.write(modified_content)
