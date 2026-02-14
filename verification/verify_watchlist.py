from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Handle native dialogs (window.confirm)
    page.on("dialog", lambda dialog: dialog.accept())

    try:
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Skip Quiz if present
        print("Checking for quiz...")
        try:
            skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
            if skip_button.is_visible(timeout=5000):
                print("Skipping quiz...")
                skip_button.click()
        except Exception:
            print("Quiz skip button not found, assuming user selection or watchlist...")

        # Select User
        print("Selecting user Aaron...")
        page.get_by_role("button", name="Select Aaron as user").click()

        # Wait for Watchlist
        print("Waiting for watchlist...")
        page.wait_for_selector('input[placeholder="What movie should we watch?"]')

        # Add a movie with unique title
        movie_title = f"Bolt Test {int(time.time())}"
        print(f"Adding movie: {movie_title}")
        page.get_by_placeholder("What movie should we watch?").fill(movie_title)
        page.get_by_role("button", name="Add movie to watchlist").click()

        # Verify added
        print("Verifying movie added...")
        expect(page.get_by_role("heading", name=movie_title)).to_be_visible()

        # Take screenshot
        page.screenshot(path="verification/watchlist_added.png")

        # Delete the movie
        print("Deleting movie...")
        page.get_by_role("button", name=f'Delete "{movie_title}"').click()

        # Wait for custom dialog
        print("Waiting for confirmation dialog...")
        dialog = page.get_by_role("alertdialog")
        expect(dialog).to_be_visible()

        print("Confirming delete (Custom UI)...")
        # This triggers confirmDeleteMovie -> deleteMovie -> window.confirm
        # The page.on("dialog") handler above should catch the second confirmation.
        dialog.get_by_role("button", name="Delete").click()

        # Verify deleted
        print("Verifying movie deleted...")
        expect(page.get_by_role("heading", name=movie_title)).not_to_be_visible()

        # Take final screenshot
        page.screenshot(path="verification/watchlist_deleted.png")
        print("Verification complete.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
