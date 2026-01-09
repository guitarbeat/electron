import time
from playwright.sync_api import sync_playwright

def verify_watchlist_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a context with viewport similar to desktop
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Navigate to the app (assuming default port 5173 for Vite, or check logs)
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", timeout=30000, wait_until="commit")

        # Wait for any potential redirect or initial load
        page.wait_for_load_state("domcontentloaded")
        print("Page loaded.")

        # 1. Skip intro if present
        try:
             skip_btn = page.get_by_role("button", name="Skip quiz and go to user selection")
             if skip_btn.is_visible(timeout=5000):
                 print("Clicking Skip button...")
                 skip_btn.click()
                 time.sleep(1)
        except:
             print("Skip button not found or not visible, proceeding...")

        # 2. Select a user (Aaron)
        try:
             print("Selecting User Aaron...")
             page.get_by_role("button", name="Select Aaron as user").click()
        except Exception as e:
             print(f"Error selecting user: {e}")
             # Maybe we are already on the watchlist if state persisted?

        # 3. Wait for Watchlist input to appear
        print("Waiting for watchlist input...")
        input_locator = page.get_by_placeholder("What movie should we watch?")
        input_locator.wait_for(state="visible", timeout=10000)

        # 4. Verify Aria Label on Input
        # Get the 'aria-label' attribute value
        aria_label = input_locator.get_attribute("aria-label")
        print(f"Input aria-label: {aria_label}")

        if aria_label == "New movie title":
            print("SUCCESS: Input has correct aria-label")
        else:
            print(f"FAILURE: Input has wrong aria-label: {aria_label}")

        # 5. Type a movie name to enable the Add button
        input_locator.fill("Test Movie For Screenshot")

        # 6. Take a screenshot of the input and button
        # We want to see the input and the add button next to it.
        # Let's verify the button doesn't have text initially (icon only)
        add_button = page.get_by_role("button", name="Add movie to watchlist")

        # Verify button is visible
        if add_button.is_visible():
            print("SUCCESS: Add button is visible")
        else:
            print("FAILURE: Add button is not visible")

        # Screenshot the whole page or relevant section
        page.screenshot(path="verification/watchlist_ui.png")
        print("Screenshot taken at verification/watchlist_ui.png")

        browser.close()

if __name__ == "__main__":
    verify_watchlist_ux()
