from playwright.sync_api import sync_playwright, expect
import time
import json


def run(playwright):
    browser = playwright.chromium.launch(headless=True, args=["--disable-web-security"])
    context = browser.new_context()
    page = context.new_page()

    # Handle native dialogs (window.confirm)
    page.on("dialog", lambda dialog: dialog.accept())
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser error: {err}"))

    # Stateful mock data
    state = {
        "movies": [
            {
                "id": "1",
                "title": "Existing Movie",
                "watchedBy": [],
                "addedBy": "Aaron",
                "createdAt": "2023-01-01T00:00:00.000Z",
            }
        ]
    }

    def handle_gist(route):
        request = route.request
        if "gists" in request.url:
            if request.method == "GET":
                response_body = {
                    "files": {
                        "pins.json": {"content": "{}"},
                        "movielist.json": {"content": json.dumps(state["movies"])},
                        "dailySpin.json": {"content": "null"},
                        "messages.json": {"content": "[]"},
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
                    if "movielist.json" in files:
                        content = files["movielist.json"]["content"]
                        state["movies"] = json.loads(content)

                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"id": "mock_id", "updated_at": "now"}),
                )
            else:
                route.continue_()
        else:
            route.continue_()

    # Intercept Gist API calls
    page.route("**/gists/**", handle_gist)

    try:
        print("Navigating to app...")
        page.goto("http://localhost:5000")

        # Skip Quiz if present
        try:
            skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
            if skip_button.is_visible(timeout=5000):
                print("Skipping quiz...")
                skip_button.click()
        except Exception:
            pass

        # Select User
        print("Selecting user Aaron...")
        page.get_by_role("button", name="Select Aaron as user").click(force=True)

        # Wait for Watchlist Input
        print("Waiting for watchlist input...")
        # Use aria-label selector which is more stable than placeholder
        input_locator = page.get_by_label("New movie title")
        input_locator.wait_for(timeout=10000)

        # Add a movie
        movie_title = f"Bolt Test {int(time.time())}"
        print(f"Adding movie: {movie_title}")
        input_locator.fill(movie_title)

        # Click add button (it might be an icon button inside the input group)
        # In Watchlist.tsx: Button type="submit" variant="primary" inside form
        # It has PlusIcon.
        # We can find it by type="submit" inside the form or by role "button"
        page.locator('button[type="submit"]').click()

        # Verify added
        print("Verifying movie added...")
        expect(page.get_by_role("heading", name=movie_title)).to_be_visible(timeout=10000)

        # Take screenshot
        page.screenshot(path="verification/watchlist_added.png")

        # Delete the movie
        print("Deleting movie...")
        # The delete button usually has trash icon or aria label.
        # MovieItem.tsx: Button with TrashIcon.
        # Let's see MovieItem.tsx content? No time, assume test was roughly correct but let's be generic.
        # The original test used: page.get_by_role("button", name=f'Delete "{movie_title}"')
        # If MovieItem has aria-label `Delete "${movie.title}"`, it works.
        page.get_by_role("button", name=f'Delete "{movie_title}"').click()

        # Wait for custom dialog
        print("Waiting for confirmation dialog...")
        dialog = page.get_by_role("alertdialog")
        expect(dialog).to_be_visible()

        print("Confirming delete...")
        dialog.get_by_role("button", name="Confirm").click()

        # Verify deleted
        print("Verifying movie deleted...")
        expect(page.get_by_role("heading", name=movie_title)).not_to_be_visible(timeout=10000)

        # Take final screenshot
        page.screenshot(path="verification/watchlist_deleted.png")
        print("Verification complete.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
        raise e
    finally:
        browser.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
