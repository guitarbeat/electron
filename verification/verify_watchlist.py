
from playwright.sync_api import sync_playwright

def verify_watchlist_input():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (using port 3000 as discovered)
        page.goto("http://localhost:3000")

        # Handle Intro Screen if present
        try:
            skip_button = page.get_by_label("Skip quiz and go to user selection")
            if skip_button.is_visible(timeout=2000):
                print("Intro screen detected. Clicking skip...")
                skip_button.click()
        except Exception:
            print("No intro screen detected or skip button not found.")

        # Handle User Selection if present (we need to select a user to see the watchlist)
        try:
            # Assuming we need to select a user. Let's look for "Aaron" or "Electra" buttons.
            # Looking at UserSelection.tsx might help, but let's try generic role button with name.
            # Or use the aria-label from grep: "Select Aaron as user"
            user_button = page.get_by_label("Select Aaron as user")
            if user_button.is_visible(timeout=2000):
                print("User selection screen detected. Selecting Aaron...")
                user_button.click()
        except Exception:
            print("No user selection screen detected or button not found.")

        # Wait for the watchlist input to be visible
        try:
            input_element = page.get_by_label("New movie title")
            input_element.wait_for(state="visible", timeout=5000)

            print("SUCCESS: Input with aria-label 'New movie title' found.")

            # Take a screenshot focusing on the input area
            page.screenshot(path="verification/watchlist_verification.png")

        except Exception as e:
            print(f"FAILURE: {e}")
            # Take a screenshot anyway to see what's there
            page.screenshot(path="verification/watchlist_failure.png")

        browser.close()

if __name__ == "__main__":
    verify_watchlist_input()
