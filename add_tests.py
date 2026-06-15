import os

files_to_update = [
    "artifacts/electron/src/utils/shared.test.ts",
    "artifacts/api-server/src/electron-api/src/utils/shared.test.ts",
    ".migration-backup/src/utils/shared.test.ts"
]

test_content = """
  await t.test("executes tasks in the correct order based on concurrency", async () => {
    const items = [1, 2, 3, 4, 5];
    const executionOrder: number[] = [];

    // We'll use a controlled function that blocks until we tell it to proceed
    // This allows us to verify concurrency behavior directly
    let activeCount = 0;

    const results = await concurrentMap(items, 2, async (item) => {
      activeCount++;
      // If we have more than 2 active tasks, the concurrency limit is broken
      assert.ok(activeCount <= 2, `Concurrency limit exceeded: ${activeCount} active tasks`);

      executionOrder.push(item);

      // Artificial delay to simulate work and allow concurrency to happen
      await new Promise(resolve => setTimeout(resolve, 10));

      activeCount--;
      return item * 10;
    });

    assert.deepEqual(results, [10, 20, 30, 40, 50]);
    // They should start in order
    assert.deepEqual(executionOrder, [1, 2, 3, 4, 5]);
  });
"""

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue

    with open(file_path, 'r') as f:
        content = f.read()

    # We want to add the new test inside the existing concurrentMap test block
    # Find the end of the concurrentMap test block

    # We will search for the end of the concurrentMap test and insert our new test
    target_string = '  await t.test("rejects if a task fails", async () => {'

    if target_string in content and "executes tasks in the correct order based on concurrency" not in content:
        content = content.replace(target_string, test_content + '\n' + target_string)

        with open(file_path, 'w') as f:
            f.write(content)
            print(f"Updated {file_path}")

print("Done")
