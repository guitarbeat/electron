from playwright.sync_api import Page, expect, sync_playwright

def test_ux_improvements(page: Page):
    # 1. Navigate to app
    page.goto("http://localhost:3000")

    # 2. Skip quiz if present
    skip_button = page.get_by_label("Skip quiz and go to user selection")
    if skip_button.is_visible():
        skip_button.click()

    # 3. Ensure we are on User Selection and Message Board is present
    expect(page.get_by_role("log", name="Message board messages")).to_be_visible()

    # --- Verify aria-describedby on error ---
    message_input = page.get_by_label("Message content")
    message_input.focus()

    # Trigger submit via Ctrl+Enter on empty field
    page.keyboard.press("Control+Enter")

    # Expect error message
    error_msg = page.locator("#submit-error")
    expect(error_msg).to_be_visible()
    expect(error_msg).to_have_text("Please enter a message")

    # Check aria-describedby
    expect(message_input).to_have_attribute("aria-describedby", "submit-error")

    print("Verified aria-describedby on error.")

    # --- Verify Delete Button Visibility on Focus ---
    # Fill name
    name_input = page.get_by_label("Your name")
    if name_input.is_visible():
        name_input.fill("Tester")

    # Fill message
    message_input.fill("Hello Accessibility")
    send_button = page.get_by_role("button", name="Send message")
    send_button.click()

    # Wait for message to appear in the log (excluding textarea)
    message_in_log = page.get_by_role("log").get_by_text("Hello Accessibility").last
    expect(message_in_log).to_be_visible()

    # Find the delete button
    # It corresponds to the last message we just added
    delete_btn = page.get_by_label("Delete message from Tester").first

    # Focus the button (scrolls into view)
    delete_btn.focus()

    # Wait for transition to complete
    page.wait_for_timeout(500)

    # Verify visibility
    expect(delete_btn).to_be_visible()

    print("Verified delete button visibility on focus.")

    # Take screenshot of the message board container
    page.locator(".message-board-container").screenshot(path="verification/ux_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_ux_improvements(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/failure.png")
            raise e
        finally:
            browser.close()
