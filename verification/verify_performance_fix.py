import time
from playwright.sync_api import Page, expect, sync_playwright

def verify_performance_fix(page: Page):
    # 1. Arrange: Go to the app.
    page.goto("http://localhost:3000")

    # Handle Intro Screen (Skip)
    try:
        skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
        if skip_button.is_visible(timeout=3000):
            skip_button.click()
            print("Skipped intro screen")
    except Exception as e:
        print(f"Intro screen skip button not found or error: {e}")

    # Handle User Selection
    try:
        user_button = page.get_by_role("button", name="Select Aaron as user")
        if user_button.is_visible(timeout=5000):
            user_button.click()
            print("Selected user Aaron")
        else:
            print("User selection button not visible (maybe already logged in?)")
    except Exception as e:
        print(f"User selection error: {e}")

    # Wait for Watchlist
    page.wait_for_selector('input[placeholder="What movie should we watch?"]', timeout=10000)
    print("On Watchlist page")

    # Monitor for native dialogs (window.confirm)
    dialog_triggered = False
    def handle_dialog(dialog):
        nonlocal dialog_triggered
        dialog_triggered = True
        print(f"Native dialog detected: {dialog.message}")
        dialog.accept() # Auto-accept if it appears, but we record it was triggered

    page.on("dialog", handle_dialog)

    # 2. Add a movie to delete
    movie_title = "Performance Test Movie " + str(int(time.time()))
    page.get_by_role("textbox", name="New movie title").fill(movie_title)
    # Click add button (it might be the button next to input)
    # The add button has aria-label="Add movie to watchlist"
    page.get_by_role("button", name="Add movie to watchlist").click()

    # Wait for movie to appear (target the heading to avoid matching toast)
    page.get_by_role("heading", name=movie_title).wait_for(state="visible", timeout=5000)
    print(f"Added movie: {movie_title}")

    # Take screenshot after adding
    page.screenshot(path="verification/1_added_movie.png")

    # 3. Delete the movie
    # Find the movie item and click delete button.
    # The delete button has aria-label='Delete "{movie_title}"'
    delete_btn = page.get_by_role("button", name=f'Delete "{movie_title}"')
    delete_btn.click()
    print("Clicked delete button on movie item")

    # 4. Wait for Custom Confirm Dialog
    # The custom dialog has title "Delete Movie" and confirm button "Delete"
    # Wait for it to appear
    # Using a more specific selector for the dialog content
    page.get_by_role("alertdialog", name="Delete Movie").wait_for(state="visible", timeout=5000)
    print("Custom confirmation dialog appeared")

    page.screenshot(path="verification/2_confirm_dialog.png")

    # Click Confirm on the custom dialog
    # The confirm button usually has text "Delete"
    # Ensure we are clicking the button INSIDE the dialog.
    page.get_by_role("button", name="Delete").last.click()
    print("Clicked Confirm in custom dialog")

    # 5. Verify movie is deleted
    # We need to wait for the MOVIE ITEM to disappear.
    # The Toast might still be there saying "Movie deleted".
    expect(page.get_by_role("heading", name=movie_title)).to_be_hidden(timeout=5000)
    print("Movie deleted")

    # 6. Check if native dialog was triggered
    if dialog_triggered:
        print("FAILURE: Native window.confirm was triggered!")
        raise Exception("Double confirmation detected! Native window.confirm was called.")
    else:
        print("SUCCESS: No native window.confirm detected.")

    page.screenshot(path="verification/3_final_state.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_performance_fix(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/failure.png")
            raise e
        finally:
            browser.close()
