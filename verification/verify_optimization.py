from playwright.sync_api import sync_playwright, expect
import time

def verify_movie_list():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context to allow init scripts
        context = browser.new_context()

        # Inject script to set localStorage to skip quiz
        context.add_init_script("localStorage.setItem('quizCompleted', 'true')")

        page = context.new_page()

        try:
            # Go to the app (port 3001)
            print("Navigating to app...")
            page.goto("http://localhost:3001")

            # Wait for load
            page.wait_for_load_state("networkidle")

            # Check for "Who's Watching?" and click Aaron
            print("Looking for User Selection...")
            try:
                # Wait for the User Selection header
                # We skip quiz check because we injected localStorage
                page.wait_for_selector('text=Who\'s Watching?', timeout=5000)
                print("Found user selection screen.")

                # Wait for the button to be stable
                time.sleep(1)

                # Use the exact aria-label for the button
                print("Clicking Aaron...")
                page.get_by_role("button", name="Select Aaron as user", exact=True).click()

            except Exception as e:
                print(f"Login step info: {e}")
                # Continue, maybe we are already logged in (if cookie persisted, though unlikely in incognito)

            # Wait for main content - increased timeout
            print("Waiting for watchlist...")
            # We look for the main input
            watchlist_input = page.locator('input[placeholder="What movie should we watch?"]')
            watchlist_input.wait_for(state="visible", timeout=10000)
            print("Found watchlist input.")

            # Type in the input
            test_movie = "Optimization Test Movie"
            watchlist_input.fill(test_movie)

            # Add the movie
            add_button = page.get_by_role("button", name="Add movie to watchlist")
            add_button.click()

            # Wait for it to appear
            print("Waiting for movie to appear in list...")
            expect(page.get_by_text(test_movie)).to_be_visible(timeout=5000)
            print("Movie added successfully.")

            # Take screenshot
            page.screenshot(path="verification/watchlist_optimized.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_movie_list()
