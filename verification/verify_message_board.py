
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_message_board(page: Page):
    # 1. Arrange: Go to the app.
    page.goto("http://localhost:3000")

    # 2. Handle Intro Screen if present
    # Check if 'Skip quiz and go to user selection' button exists
    skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
    if skip_button.is_visible():
        print("Skipping intro...")
        skip_button.click()

    # 3. Select a user (Aaron)
    print("Selecting user Aaron...")
    user_button = page.get_by_role("button", name="Select Aaron as user")
    user_button.click()

    # 4. Wait for Watchlist to appear (indicating login success)
    # The message board is also visible now.
    print("Waiting for watchlist/message board...")
    page.wait_for_selector('input[placeholder="What movie should we watch?"]')

    # 5. Verify Message Board is present
    message_input = page.get_by_placeholder("Type a message...")
    expect(message_input).to_be_visible()

    # 6. Post a message
    test_message = f"Performance Test Message {time.time()}"
    print(f"Posting message: {test_message}")
    message_input.fill(test_message)

    # Click send
    send_button = page.get_by_role("button", name="Send message")
    send_button.click()

    # 7. Wait for message to appear
    print("Waiting for message to appear...")
    # Using specific locator for the message content
    page.get_by_text(test_message).wait_for(state="visible")

    # 8. Hover to show delete button (verification of item interactivity)
    print("Hovering over message...")
    message_element = page.get_by_text(test_message).locator("..").locator("..") # Go up to container
    message_element.hover()

    # Wait a bit for hover effect
    time.sleep(0.5)

    # 9. Screenshot
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/message_board_opt.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_message_board(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
            raise e
        finally:
            browser.close()
