from playwright.sync_api import sync_playwright, expect
import time

def verify_movie_list():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to the app
            page.goto("http://localhost:5173")

            # Wait for content to load
            # Check if we are on Quiz or User Selection
            # The error screenshot shows User Selection directly.
            # So "Skip for now" might not be present if we land directly on UserSelection (no quiz logic?)

            # Try to handle Quiz if it appears, otherwise look for User Selection
            try:
                if page.get_by_text("Skip for now").is_visible(timeout=2000):
                    page.get_by_text("Skip for now").click()
            except:
                print("No quiz 'Skip for now' button found, continuing...")

            # Select User (Aaron)
            # The buttons have text "Aaron" and "Electra".
            # Using get_by_role("button", name="Aaron") should work.
            page.wait_for_selector("button:has-text('Aaron')", timeout=5000)
            page.get_by_role("button", name="Aaron").click()

            # Wait for Watchlist to load (look for specific elements)
            page.wait_for_selector("text=Spin to Decide", timeout=10000)

            # Take a screenshot of the initial list
            page.screenshot(path="verification/watchlist_initial.png")
            print("Initial screenshot taken.")

            # Add a movie to verify interactivity
            input_field = page.get_by_placeholder("What movie should we watch?")
            input_field.fill("Performance Test Movie")

            add_button = page.get_by_label("Add movie to watchlist")
            add_button.click()

            # Wait for the toast or the movie to appear
            page.wait_for_selector("text=Performance Test Movie", timeout=5000)

            # Take a screenshot with the new movie
            page.screenshot(path="verification/watchlist_added.png")
            print("Added movie screenshot taken.")

            # Find the delete button for the new movie
            # We need to find the card that contains "Performance Test Movie" and then find the delete button inside it.
            # Playwright's chaining:
            movie_card = page.locator(".movie-card").filter(has_text="Performance Test Movie")
            delete_button = movie_card.get_by_label("Delete \"Performance Test Movie\"")

            # Setup dialog handler for confirmation
            page.on("dialog", lambda dialog: dialog.accept())

            # Click delete
            delete_button.click()

            # Wait for movie to disappear
            expect(movie_card).to_be_hidden()

            # Take a screenshot after deletion
            page.screenshot(path="verification/watchlist_deleted.png")
            print("Deleted movie screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_movie_list()
