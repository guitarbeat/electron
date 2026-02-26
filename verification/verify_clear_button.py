from playwright.sync_api import sync_playwright

def verify_clear_button():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        try:
            print("Navigating to home...")
            page.goto("http://localhost:3000")

            # Wait for and click the Movies tab
            # App.tsx: label: 'Movies', rendered inside a button
            print("Clicking Movies tab...")
            # Using get_by_role is more accessible/robust
            page.get_by_role("button", name="Movies").click()

            # Wait for the search input to appear
            # index.tsx: aria-label="Search or add a movie"
            print("Waiting for search input...")
            search_input = page.get_by_label("Search or add a movie")
            search_input.wait_for(state="visible", timeout=10000)

            # Type into the search box
            print("Typing 'Inception'...")
            search_input.fill("Inception")

            # Wait for clear button to appear (aria-label="Clear search")
            print("Waiting for clear button...")
            clear_button = page.get_by_label("Clear search")
            clear_button.wait_for(state="visible", timeout=5000)

            # Take screenshot before clearing
            page.screenshot(path="verification/before_clear.png")
            print("Screenshot taken: before_clear.png")

            # Click clear button
            print("Clicking clear button...")
            clear_button.click()

            # Check if input is empty
            print("Verifying input is empty...")
            val = search_input.input_value()
            if val != "":
                raise Exception(f"Input value should be empty, but is '{val}'")

            page.screenshot(path="verification/after_clear.png")
            print("Screenshot taken: after_clear.png")
            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_v3.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_clear_button()
