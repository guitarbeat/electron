import time
from playwright.sync_api import sync_playwright

def verify_optimization():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions or modify viewport if needed, but default is usually fine
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # 1. Handle Intro/Quiz Screen
        # The button text is "Skip for Now"
        # The aria-label is "Skip quiz and go to user selection"
        try:
            print("Looking for 'Skip for Now' button...")
            skip_button = page.get_by_label("Skip quiz and go to user selection")

            # Wait longer for initial load (up to 5s)
            if skip_button.is_visible(timeout=5000):
                print("Found Quiz screen. Clicking 'Skip for Now'...")
                skip_button.click()
                time.sleep(1) # transition
            else:
                print("Did not see 'Skip for Now' button (might be on User Selection already).")
        except Exception as e:
            print(f"Quiz check exception: {e}")
            # Fallback check - maybe text search?
            if page.get_by_text("Skip for Now").is_visible():
                page.get_by_text("Skip for Now").click()
                time.sleep(1)

        # 2. Handle User Selection Screen
        try:
            print("Looking for User Selection...")
            # Using specific aria-label from UserSelection.tsx
            aaron_button = page.get_by_label("Select Aaron as user")

            # Wait a bit in case animation is happening
            if aaron_button.is_visible(timeout=5000):
                print("Found User Selection screen. Clicking 'Aaron'...")
                aaron_button.click()
                time.sleep(1) # transition
            else:
                 print("Did not see User Selection buttons (might be on Watchlist already).")
        except Exception as e:
            print(f"Error handling User Selection: {e}")

        # 3. Verify Watchlist
        try:
            print("Waiting for 'Movies' text...")
            # This is the header of the watchlist "Your Movies" or just "Movies" in a tab?
            # Let's check for something unique to the watchlist, e.g., the add button or search input
            # Or the text "Movies" if it's a heading.
            page.wait_for_selector("text=Movies", timeout=15000)
            print("SUCCESS: 'Movies' text found. Optimization verified visually.")

            # Take a screenshot
            page.screenshot(path="verification/success.png")
            print("Screenshot saved to verification/success.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_retry_2.png")
            raise e

        browser.close()

if __name__ == "__main__":
    verify_optimization()
