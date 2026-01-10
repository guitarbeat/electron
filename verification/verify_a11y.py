from playwright.sync_api import sync_playwright, expect
import time

def verify_accessibility(page):
    print("Navigating to homepage...")
    page.goto("http://localhost:3000")

    # 0. Handle Intro/Quiz Screen
    print("Checking for Intro screen...")

    try:
        # Wait for any content to load first
        page.wait_for_load_state("networkidle")

        # Check if we are on the intro screen
        intro_heading = page.query_selector("text=Personality Quiz")

        if intro_heading:
            print("Intro screen detected via heading.")
            # Try to click the skip button using the exact text
            skip_button = page.get_by_text("Skip for Now", exact=True)
            if skip_button.count() > 0:
                 skip_button.first.click()
                 print("Clicked skip button.")
            else:
                 page.get_by_role("button", name="Skip for Now").click()
                 print("Clicked skip button via role.")
            time.sleep(1) # Wait for animation

    except Exception as e:
        print(f"Intro screen handling error (ignoring): {e}")

    # 1. Login (User Selection)
    print("Looking for user selection...")
    try:
        # Wait for the user selection screen to be visible
        page.wait_for_selector("text=Who's Watching?", timeout=5000)
        print("User selection screen found.")

        # Click Aaron button using the specific aria-label which is unique
        page.locator('button[aria-label="Select Aaron as user"]').click()
        print("Clicked Aaron.")
    except Exception as e:
        print(f"Could not find user selection button: {e}")
        page.screenshot(path="verification/debug_user_selection_fail.png")
        raise e

    # Wait for the watchlist to load
    print("Waiting for watchlist to load...")
    try:
        page.wait_for_selector("text=Aaron & Electra's Movie List", timeout=10000)
        print("Watchlist loaded.")
    except Exception as e:
         print(f"Watchlist didn't load: {e}")
         page.screenshot(path="verification/debug_watchlist_load.png")
         raise e

    # 2. Verify Input aria-label
    print("Verifying input aria-label...")
    input_field = page.get_by_role("textbox", name="New movie title")
    expect(input_field).to_be_visible()
    print("Input field found.")

    # 3. Verify Spin to Decide button aria-describedby
    print("Verifying spin button...")
    spin_button = page.get_by_role("button", name="Spin to Decide")
    expect(spin_button).to_be_visible()

    if spin_button.is_disabled():
        print("Button is disabled, checking aria-describedby")
        expect(spin_button).to_have_attribute("aria-describedby", "spin-wheel-disabled-reason")

        # Verify the described element exists and is visible
        reason_text = page.locator("#spin-wheel-disabled-reason")
        expect(reason_text).to_be_visible()
        print("Reason text found:", reason_text.text_content())
    else:
        print("Button is enabled (list has >= 2 items).")

    # Take a screenshot
    page.screenshot(path="verification/accessibility_check.png")
    print("Verification script finished successfully.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_accessibility(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
