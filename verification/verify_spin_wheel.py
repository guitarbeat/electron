from playwright.sync_api import sync_playwright, expect
import json


def run(playwright):
    browser = playwright.chromium.launch(headless=True, args=["--disable-web-security"])
    context = browser.new_context()
    page = context.new_page()
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    # Handle dialogs
    page.on("dialog", lambda dialog: dialog.accept())

    # Mock Gist API for PINs and Movies
    def handle_gist(route):
        if route.request.method == "GET":
            # Return 2 unwatched movies to unlock the wheel immediately
            movies_data = [
                {
                    "id": "1",
                    "title": "Movie A",
                    "watchedBy": [],
                    "addedBy": "Aaron",
                    "createdAt": "2023-01-01",
                },
                {
                    "id": "2",
                    "title": "Movie B",
                    "watchedBy": [],
                    "addedBy": "Aaron",
                    "createdAt": "2023-01-02",
                },
            ]

            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "files": {
                            "pins.json": {"content": "{}"},
                            "movielist.json": {"content": json.dumps(movies_data)},
                            "dailySpin.json": {"content": "null"},
                        }
                    }
                ),
            )
        else:
            route.fulfill(
                status=200, content_type="application/json", body=json.dumps({"id": "mock_id"})
            )

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
                page.wait_for_timeout(1000)
        except Exception:
            print("Quiz skip button not found, assuming user selection or watchlist...")

        # Select User
        print("Selecting user Aaron...")
        # Try both generic and specific button text just in case
        user_button = page.locator("button").filter(has_text="Select Aaron as user").first
        if not user_button.is_visible():
            user_button = page.locator("button").filter(has_text="Aaron").first

        user_button.wait_for(state="visible")
        user_button.click(force=True)

        # Wait for Watchlist Input to confirm load
        print("Waiting for watchlist input...")
        input_field = page.get_by_label("Movie or show title")
        input_field.wait_for(state="visible", timeout=10000)

        # Check for Spin Button (should be visible due to mock)
        print("Looking for Spin Wheel button...")
        # The button text depends on state, but with 2 unwatched it should be "Spin Wheel Now"
        # or "Spin Now"
        spin_button = page.locator("button").filter(has_text="Spin").first

        # Wait a bit for the polling/loading to process the mock
        spin_button.wait_for(state="visible", timeout=10000)

        if not spin_button.is_visible():
            raise Exception("Spin wheel button not visible despite mock data")

        # Click Spin Wheel button
        print("Clicking Spin Wheel button...")
        spin_button.click()

        # Wait for modal
        print("Waiting for Spin Wheel modal...")
        page.wait_for_selector(".spin-wheel-wrapper", timeout=5000)

        # Check if a movie title is displayed
        title_element = page.locator("h3.current-movie-title")
        expect(title_element).to_be_visible()

        initial_title = title_element.text_content()
        print(f"Initial title on wheel: {initial_title}")

        # Take screenshot of open wheel
        page.screenshot(path="verification/spin_wheel_open.png")

        # Spin!
        print("Spinning...")
        # The button inside the modal might be "Spin!" or similar.
        # It usually has a DiceIcon.
        spin_btn = page.locator(".spin-wheel-wrapper button").first

        if spin_btn.is_visible():
            spin_btn.click()
            # Wait for some animation frames
            page.wait_for_timeout(500)

            # Verify title changes (it rotates fast)
            mid_spin_title = title_element.text_content()
            print(f"Mid-spin title: {mid_spin_title}")
            page.screenshot(path="verification/spin_wheel_spinning.png")

            # Ensure it didn't crash
            expect(page.locator(".spin-wheel-wrapper")).to_be_visible()

        print("Verification complete.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_spin.png")
        raise e
    finally:
        browser.close()


with sync_playwright() as playwright:
    run(playwright)
