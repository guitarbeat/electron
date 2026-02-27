from playwright.sync_api import sync_playwright, expect
import os

def test_message_item_styles(page):
    # Navigate to the app (assuming it's running on port 5173 or similar)
    # Since we can't easily start the server and wait for it here, we'll assume the environment is set up.
    # However, for this environment, we might need to rely on static analysis if the server isn't running.
    # But the instructions say "Start the Application".

    # NOTE: In this restricted environment, I cannot guarantee the dev server is running or reachable
    # from this script without blocking the agent.
    # I will try to navigate to the local file if possible, or a placeholder URL.
    # For a React app, we need the dev server.

    # Assuming the user or environment starts the server.
    # If not, this script will fail, and I will handle that.
    page.goto("http://localhost:5173")

    # Wait for the message board to be visible
    # The message board might be floating or embedded.
    # In App.tsx: <MessageBoard mode="floating" /> is present.

    # Wait for the floating message bubble/icon to appear
    page.wait_for_selector('button[aria-label="Open chat"]')

    # Click to open chat
    page.click('button[aria-label="Open chat"]')

    # Wait for messages to load
    page.wait_for_selector('.imessage-bubble', timeout=10000)

    # Check if the bubble has the correct class
    bubbles = page.locator('.imessage-bubble')
    expect(bubbles.first).to_be_visible()

    # Take a screenshot
    page.screenshot(path="verification/message_item_styles.png")
    print("Screenshot saved to verification/message_item_styles.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_message_item_styles(page)
        except Exception as e:
            print(f"Error: {e}")
            # If server is not running, we might catch it here.
        finally:
            browser.close()
