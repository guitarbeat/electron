from playwright.sync_api import sync_playwright, expect
import time
import json

# Mock data state
mock_data = {
    "files": {
        "movielist.json": {"content": "[]"},
        "messages.json": {"content": "[]"},
        "quiz.json": {"content": "{}"},
        "suggestions.json": {"content": "[]"},
        "pins.json": {"content": "{}"},
    }
}


def handle_gist_request(route):
    request = route.request
    if request.method == "GET":
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(mock_data),
            headers={"Access-Control-Allow-Origin": "*"},
        )
    elif request.method == "PATCH":
        try:
            post_data = request.post_data_json
            if "files" in post_data:
                for filename, file_data in post_data["files"].items():
                    if "content" in file_data:
                        mock_data["files"][filename] = {"content": file_data["content"]}

            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(mock_data),
                headers={"Access-Control-Allow-Origin": "*"},
            )
        except Exception as e:
            print(f"Error handling PATCH: {e}")
            route.abort()
    else:
        route.continue_()


def test_watchlist_functionality(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Mock GitHub API
    page.route("**/gists/*", handle_gist_request)

    # Set quiz completed to bypass intro
    page.add_init_script("localStorage.setItem('quizCompleted', 'true')")

    # Go to app
    page.goto("http://localhost:5000")

    # Select Aaron
    page.get_by_role("button", name="Select Aaron as user").click(force=True)

    # Wait for Watchlist component to load
    page.wait_for_selector('input[aria-label="New movie title"]')

    # Add a movie
    timestamp = int(time.time())
    movie_name = f"Test Movie {timestamp}"

    input_field = page.get_by_label("New movie title")
    input_field.fill(movie_name)

    # Click submit button
    submit_btn = page.locator('button[type="submit"]')
    submit_btn.click()

    # Wait for movie to appear (as heading)
    expect(page.get_by_role("heading", name=movie_name)).to_be_visible(timeout=10000)

    # Take screenshot of added movie
    page.screenshot(path="verification/verification_added.png")

    # Find the delete button for this movie
    delete_btn = page.locator(f'button[aria-label="Delete \\"{movie_name}\\""]')
    delete_btn.click()

    # Confirm dialog
    confirm_btn = page.get_by_role("button", name="Confirm")
    if not confirm_btn.is_visible():
        confirm_btn = page.get_by_text("Confirm", exact=True)
        if not confirm_btn.is_visible():
            confirm_btn = page.get_by_text("Delete", exact=True)

    confirm_btn.click()

    # Verify movie is gone
    expect(page.get_by_role("heading", name=movie_name)).not_to_be_visible()

    print("Verification successful!")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_watchlist_functionality(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/verification_error.png")
            raise e
        finally:
            browser.close()
