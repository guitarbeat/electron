from playwright.sync_api import sync_playwright, expect


def test_add_message(page):
    # 1. Go to homepage
    page.goto("http://localhost:3000/")

    # 2. Handle Intro/Quiz if present
    # Check for "Skip for Now" button or "Skip quiz" aria-label
    skip_button = page.get_by_role("button", name="Skip for Now")
    if skip_button.is_visible():
        skip_button.click()

    # Also check "Skip quiz and go to user selection" aria-label
    skip_aria = page.get_by_role("button", name="Skip quiz and go to user selection")
    if skip_aria.is_visible():
        skip_aria.click()

    # 3. Select User "Aaron"
    # Wait for UserSelection to appear
    # Button aria-label "Select Aaron as user"
    aaron_btn = page.get_by_role("button", name="Select Aaron as user")
    aaron_btn.click()

    # 4. Wait for Watchlist to appear (indicates login success)
    expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible()

    # 5. Find MessageBoard input
    msg_input = page.get_by_label("Message content")

    # Scroll to it
    msg_input.scroll_into_view_if_needed()

    # 6. Type a message
    test_message = "Hello from Bolt verification!"
    msg_input.fill(test_message)

    # 7. Click Send
    send_btn = page.get_by_role("button", name="Send message")
    send_btn.click()

    # 8. Verify message appears
    # It might take a moment
    expect(page.get_by_text(test_message)).to_be_visible(timeout=10000)

    # 9. Take screenshot
    page.screenshot(path="verification/verification_message_board.png")
    print("Verification screenshot saved to verification/verification_message_board.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_add_message(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
