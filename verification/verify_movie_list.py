from playwright.sync_api import sync_playwright

def verify_watchlist():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173")

        # Handle Quiz Intro if present
        try:
            print("Checking for Quiz Intro...")
            if page.is_visible('text=Personality Quiz'):
                print("Quiz Intro found. Clicking 'Skip for Now'...")
                page.click('button:has-text("Skip for Now")')
                page.wait_for_timeout(1000)
            else:
                 print("Quiz Intro not visible.")
        except Exception as e:
            print(f"Error checking Quiz Intro: {e}")

        # Wait for user selection to appear (since we might be logged out initially)
        try:
            print("Checking for UserSelection screen...")
            if page.is_visible('text=Who\'s Watching?'):
                print("At UserSelection screen, logging in as Aaron...")
                page.click('button:has-text("Aaron")')
            else:
                print("User selection not visible. Maybe already logged in?")
        except Exception as e:
            print(f"Error checking UserSelection: {e}")

        # Wait for Watchlist to appear
        try:
             print("Waiting for movie title or empty state...")
             # Using CSS selector for class OR text selector
             page.wait_for_function("""
                () => document.querySelector('.movie-title') || document.body.innerText.includes('Your movie list is empty')
             """, timeout=10000)
             print("Found movie list or empty state.")
        except Exception as e:
             print(f"Error waiting for selector: {e}")


        # Take a screenshot to verify the list is rendering correctly
        page.screenshot(path="verification/watchlist.png")
        print("Screenshot saved to verification/watchlist.png")

        browser.close()

if __name__ == "__main__":
    verify_watchlist()
