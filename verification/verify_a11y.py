
import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        # Navigate to the app (using preview port 4173)
        print("Navigating to app...")
        page.goto("http://localhost:4173")

        # Check if we are on the quiz page and skip it if so
        print("Checking for quiz...")
        if page.get_by_text("Personality Quiz").is_visible():
            print("Skipping Personality Quiz...")
            # Use get_by_text for "Skip for Now" as it might not be a standard button role or button implementation might be tricky
            page.get_by_text("Skip for Now").click()

        # Wait for user selection and click Aaron
        print("Selecting user Aaron...")
        page.get_by_role("button", name="Aaron").click()

        # Wait for watchlist to load
        page.wait_for_timeout(2000)

        print("Checking for accessible input...")
        # This is expected to fail before changes because there is no label
        try:
            page.get_by_role("textbox", name="New movie title").click(timeout=2000)
            print("SUCCESS: Input has accessible label!")
        except Exception as e:
            print("FAILURE: Input does not have accessible label (Expected).")

        # Try to add a movie to trigger toast
        print("Adding a movie to trigger toast...")
        page.get_by_placeholder("What movie should we watch?").fill("Test Movie Accessibility")
        page.get_by_role("button", name="Add movie to watchlist").click()

        print("Checking for accessible toast...")
        # This is expected to fail before changes because toast has no role
        try:
            # We look for role="status" or "alert"
            toast = page.locator('[role="status"]').or_(page.locator('[role="alert"]'))
            expect(toast).to_be_visible(timeout=5000)
            print(f"SUCCESS: Toast found with accessible role!")
        except Exception as e:
            print("FAILURE: Toast not found by role (Expected).")

        page.screenshot(path="verification/final_verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
