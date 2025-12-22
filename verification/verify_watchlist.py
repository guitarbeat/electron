from playwright.sync_api import sync_playwright

def verify_watchlist():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:3000")
        try:
            page.goto("http://localhost:3000", timeout=30000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        page.wait_for_timeout(2000) # Wait for load

        # Handle Personality Quiz Screen
        if page.get_by_text("Personality Quiz").is_visible():
            print("Found Personality Quiz screen")
            if page.get_by_text("Skip for Now").is_visible():
                 print("Clicking Skip for Now")
                 page.get_by_text("Skip for Now").click()
                 page.wait_for_timeout(2000) # Wait for transition

        # Handle User Selection Screen
        if page.get_by_text("Who's Watching?").is_visible():
            print("Found user selection screen (Who's Watching?)")
            page.get_by_text("Aaron", exact=True).click()
            page.wait_for_timeout(2000)
        elif page.get_by_text("Who is watching?").is_visible():
            print("Found user selection screen (Who is watching?)")
            page.get_by_text("Aaron").click()
            page.wait_for_timeout(2000)

        # Check for Watchlist
        input_field = page.get_by_placeholder("What movie should we watch?")
        if input_field.is_visible():
            print("Found input field - Watchlist loaded")
            input_field.fill("Test Movie Input Performance")
            # Wait a bit to ensure no crash
            page.wait_for_timeout(1000)
        else:
            print("Input field not found - Watchlist not loaded")

        # Take screenshot
        page.screenshot(path="verification/watchlist_verification.png")
        print("Screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_watchlist()
