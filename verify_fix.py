import os
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Inject localStorage to skip quiz AND set current user
        context.add_init_script("""
            localStorage.setItem('quizCompleted', 'true');
            sessionStorage.setItem('currentUser', 'Aaron');
        """)

        page = context.new_page()
        page.goto("http://localhost:3000")

        # Wait for page load
        page.wait_for_timeout(2000)

        # Should be on Watchlist immediately
        print("Checking for Watchlist...")

        # Verify we are on Watchlist
        try:
            # Look for the input "What movie should we watch?"
            # Or the Header "Movie Watchlist"
            expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible(timeout=10000)
        except:
            print("Watchlist input not found. Taking debug screenshot.")
            page.screenshot(path="verification/debug_watchlist_failed.png")
            # browser.close()
            # return
            raise

        print("Watchlist loaded.")

        # Locate the Add button
        # Using exact selector for the button we modified
        add_btn = page.locator("button[aria-label='Add movie to watchlist']")

        if not add_btn.is_visible():
            print("Add button not found on Watchlist!")
            page.screenshot(path="verification/debug_add_btn_missing.png")
            return

        # Take a screenshot of the button specifically to verify circular shape
        # We verify it exists and is visible.
        # Ideally we want to verify it DOES NOT show text "Loading..." (which we can't unless it's loading)
        # But we can verify it looks like a circle.

        box = add_btn.bounding_box()
        print(f"Button dimensions: {box['width']}x{box['height']}")

        add_btn.screenshot(path="verification/add_button.png")

        # Take a full page screenshot
        page.screenshot(path="verification/watchlist.png")
        print("Captured verification/watchlist.png and verification/add_button.png")

        browser.close()

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    run()
