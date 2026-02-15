from playwright.sync_api import sync_playwright, expect
import json
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True, args=["--disable-web-security"])
    context = browser.new_context()
    page = context.new_page()

    # Stateful mock
    state = {
        "messages": []
    }

    def handle_gist(route):
        request = route.request
        if "gists" in request.url:
            if request.method == "GET":
                response_body = {
                    "files": {
                         "pins.json": {"content": "{}"},
                         "movielist.json": {"content": "[]"},
                         "dailySpin.json": {"content": "null"},
                         "messages.json": {"content": json.dumps(state["messages"])},
                         "quiz.json": {"content": "[]"},
                         "suggestions.json": {"content": "[]"},
                    }
                }
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(response_body),
                )
            elif request.method == "PATCH":
                post_data = request.post_data_json
                if post_data and "files" in post_data:
                    files = post_data["files"]
                    if "messages.json" in files:
                        content = files["messages.json"]["content"]
                        state["messages"] = json.loads(content)

                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"id": "mock_id", "updated_at": "now"}),
                )
            else:
                route.continue_()
        else:
            route.continue_()

    page.route("**/gists/**", handle_gist)

    try:
        # 1. Go to homepage
        page.goto("http://localhost:5000/")

        # 2. Handle Intro/Quiz if present
        try:
            skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
            if skip_button.is_visible(timeout=5000):
                skip_button.click()
        except Exception:
            pass

        # 3. Select User "Aaron"
        page.get_by_role("button", name="Select Aaron as user").click(force=True)

        # 4. Wait for Watchlist (indicates login success)
        page.get_by_label("New movie title").wait_for(timeout=10000)

        # 5. Find MessageBoard input
        msg_input = page.get_by_label("Message content")
        msg_input.scroll_into_view_if_needed()

        # 6. Type a message
        test_message = f"Hello from Bolt verification! {int(time.time())}"
        msg_input.fill(test_message)

        # 7. Click Send
        # The send button usually has aria-label "Send message" or similar icon
        # Looking at MessageInput.tsx? Assuming aria-label "Send message" is correct as per old test
        send_btn = page.get_by_role("button", name="Send message")
        send_btn.click()

        # 8. Verify message appears
        expect(page.get_by_text(test_message)).to_be_visible(timeout=10000)

        # 9. Take screenshot
        page.screenshot(path="verification/verification_message_board.png")
        print("Verification screenshot saved to verification/verification_message_board.png")

    except Exception as e:
        print(f"Test failed: {e}")
        page.screenshot(path="verification/error.png")
        raise e
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
