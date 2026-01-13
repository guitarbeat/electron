
import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the app (using port 3000 as per server.log)
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # 2. Handle Intro Screen if present
        try:
            skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
            if skip_button.is_visible(timeout=5000):
                print("Skipping intro...")
                skip_button.click()
        except:
            print("Intro screen not found or already skipped")

        # 3. Handle User Selection
        print("Selecting user Aaron...")
        user_button = page.get_by_role("button", name="Select Aaron as user")
        user_button.click()

        # 4. Wait for Watchlist to load
        print("Waiting for watchlist...")
        page.wait_for_selector('input[placeholder="What movie should we watch?"]', timeout=10000)

        # 5. Add a test movie if list is empty or to ensure we have one to delete
        print("Adding test movie...")
        input_field = page.get_by_label("New movie title") # Updated label
        input_field.fill("Test Movie For Deletion")
        page.get_by_role("button", name="Add movie to watchlist").click()

        # Wait for movie to appear - wait for the text to appear in the list
        page.locator(".movie-title", has_text="Test Movie For Deletion").first.wait_for(state="visible")

        # 6. Click delete button for the test movie
        print("Clicking delete button...")
        # Since the test might fail if duplicates exist (previous failed runs), we take the FIRST one.
        delete_button = page.get_by_role("button", name='Delete "Test Movie For Deletion"').first
        delete_button.click()

        # 7. Verify Confirm Dialog appears
        print("Verifying confirm dialog...")
        dialog = page.get_by_role("alertdialog", name="Delete Movie") # Updated role
        expect(dialog).to_be_visible()

        # Check description
        expect(page.get_by_text('Are you sure you want to delete "Test Movie For Deletion"?')).to_be_visible()

        # 8. Take screenshot of the dialog
        print("Taking screenshot...")
        time.sleep(0.5) # Wait for animation
        page.screenshot(path="verification/confirm_dialog.png")

        # 9. Test Cancel
        print("Testing cancel...")
        page.get_by_role("button", name="Cancel").click()
        expect(dialog).not_to_be_visible()

        # 10. Open dialog again and Confirm
        print("Testing confirm...")
        delete_button.click()
        page.get_by_role("button", name="Delete", exact=True).click()

        # Verify movie is gone (or at least one of them is gone)
        # We wait for the count to decrease or for the specific one to disappear?
        # Just check that the delete button we clicked is no longer there/visible
        expect(delete_button).not_to_be_visible()

        print("Verification successful!")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
