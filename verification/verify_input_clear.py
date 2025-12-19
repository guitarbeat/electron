from playwright.sync_api import sync_playwright, expect
import time

def verify_input_clear(page):
    print("Navigating to app...")
    page.goto("http://localhost:3002")

    # Wait a bit for React to hydrate/render
    page.wait_for_timeout(2000)

    # 1. Handle Quiz Modal (if present)
    print("Checking for 'Skip for Now'...")
    try:
        # Using text locator which is often safer for buttons with complex content
        skip_locator = page.get_by_text("Skip for Now")
        if skip_locator.is_visible():
            print("Found Skip button. Clicking...")
            skip_locator.click()
            page.wait_for_timeout(1000)
        else:
            print("Skip button not visible.")
    except Exception as e:
        print(f"Error checking skip: {e}")

    # 2. Handle User Selection (if present)
    print("Checking for User Selection...")
    try:
        # Using specific label to avoid ambiguity
        aaron_locator = page.get_by_label("Select Aaron as user")
        if aaron_locator.is_visible():
            print("Found Aaron button. Clicking...")
            aaron_locator.click()
            page.wait_for_timeout(1000)
        else:
            print("Aaron button not visible.")
    except Exception as e:
        print(f"Error checking Aaron: {e}")

    # 3. Verify Watchlist Input
    print("Looking for watchlist input...")
    input_locator = page.get_by_placeholder("What movie should we watch?")
    expect(input_locator).to_be_visible(timeout=10000)

    print("Typing 'The Matrix'...")
    input_locator.fill("The Matrix")

    # 4. Verify Clear Button
    print("Verifying clear button visibility...")
    clear_button = page.get_by_label("Clear input")
    expect(clear_button).to_be_visible()

    print("Taking screenshot 1 (with text)...")
    page.screenshot(path="verification/input_with_text.png")

    # 5. Click Clear
    print("Clicking clear button...")
    clear_button.click()

    # 6. Verify Cleared
    print("Verifying input is empty...")
    expect(input_locator).to_have_value("")
    expect(clear_button).not_to_be_visible()

    print("Taking screenshot 2 (cleared)...")
    page.screenshot(path="verification/input_cleared.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Create context with viewport size
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        try:
            verify_input_clear(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
