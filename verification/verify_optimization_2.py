from playwright.sync_api import sync_playwright, expect

def test_add_message(page):
    # ... setup ...
    page.goto("http://localhost:3000/")

    skip_button = page.get_by_role("button", name="Skip for Now")
    if skip_button.is_visible():
        skip_button.click()

    skip_aria = page.get_by_role("button", name="Skip quiz and go to user selection")
    if skip_aria.is_visible():
        skip_aria.click()

    aaron_btn = page.get_by_role("button", name="Select Aaron as user")
    aaron_btn.click()

    expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible()

    msg_input = page.get_by_label("Message content")
    msg_input.scroll_into_view_if_needed()

    test_message = "Hello from Bolt verification attempt 2!"
    msg_input.fill(test_message)

    send_btn = page.get_by_role("button", name="Send message")
    send_btn.click()

    # Verify message appears in the list (role=log)
    # We look for the text inside the log container
    log = page.get_by_role("log", name="Message board messages")
    expect(log).to_be_visible()

    # Wait for the message inside the log
    # Using .filter to ensure it's inside the log
    message_bubble = log.get_by_text(test_message)
    expect(message_bubble).to_be_visible(timeout=10000)

    # Also verify input is cleared
    expect(msg_input).to_have_value("", timeout=5000)

    page.screenshot(path="verification/verification_message_board_2.png")
    print("Verification screenshot saved to verification/verification_message_board_2.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_add_message(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error_2.png")
        finally:
            browser.close()
