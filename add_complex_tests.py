import os

files_to_update = [
    "artifacts/electron/src/utils/shared.test.ts",
    "artifacts/api-server/src/electron-api/src/utils/shared.test.ts",
    ".migration-backup/src/utils/shared.test.ts"
]

test_content = """
  await t.test("verifies tasks start concurrently but do not exceed concurrency limit", async () => {
    const items = [1, 2, 3, 4, 5];
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    // We use a promise that we control to make tasks "hang" until we resolve it
    let releaseTasks: () => void;
    const hangPromise = new Promise<void>(resolve => {
      releaseTasks = resolve;
    });

    // Start the concurrent map
    const mapPromise = concurrentMap(items, 2, async (item) => {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

      // Wait for the release signal
      await hangPromise;

      currentConcurrent--;
      return item * 2;
    });

    // Let the event loop cycle so the workers can start and block on hangPromise
    await new Promise(resolve => setTimeout(resolve, 50));

    // At this point, only 2 tasks should have started because concurrency is 2
    assert.equal(maxConcurrent, 2, "Should start exactly up to concurrency limit");

    // Release the tasks
    releaseTasks!();

    const results = await mapPromise;
    assert.deepEqual(results, [2, 4, 6, 8, 10]);
  });
"""

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue

    with open(file_path, 'r') as f:
        content = f.read()

    target_string = '  await t.test("rejects if a task fails", async () => {'

    if target_string in content and "verifies tasks start concurrently but do not exceed concurrency limit" not in content:
        content = content.replace(target_string, test_content + '\n' + target_string)

        with open(file_path, 'w') as f:
            f.write(content)
            print(f"Updated {file_path}")

print("Done")
