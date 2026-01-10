
from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            # Handle Quiz if present
            try:
                print("Checking for quiz...")
                # Wait briefly to see what loads
                page.wait_for_timeout(2000)

                if page.get_by_text("Personality Quiz").is_visible():
                    print("Quiz found, clicking Skip...")
                    page.get_by_text("Skip for Now").click(force=True)
                    print("Clicked Skip. Waiting for transition...")
                    page.wait_for_timeout(2000)
            except Exception as e:
                print(f"Quiz check/skip exception: {e}")

            print("Waiting for User Selection...")
            expect(page.get_by_text("Who's Watching?")).to_be_visible(timeout=10000)

            print("Selecting user Aaron...")
            # Using exact=True to avoid ambiguity if needed, but aria-label should be unique
            page.get_by_role("button", name="Select Aaron as user").click()

            print("Waiting for Watchlist...")
            expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible(timeout=10000)

            input_locator = page.get_by_placeholder("What movie should we watch?")

            # Verify ID presence
            input_id = input_locator.get_attribute("id")
            print(f"Input ID found: {input_id}")

            if not input_id:
                raise Exception("Input element does not have an ID attribute!")

            # Verify aria-invalid
            aria_invalid = input_locator.get_attribute("aria-invalid")
            print(f"aria-invalid: {aria_invalid}")

            # Take screenshot
            page.screenshot(path="verification/input_verification.png")
            print("Screenshot saved to verification/input_verification.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
