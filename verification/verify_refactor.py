from playwright.sync_api import sync_playwright, expect
import time

def verify_watchlist(page):
    page.set_default_timeout(10000)

    # Navigate
    try:
        page.goto("http://localhost:3000", timeout=5000)
    except:
        try:
            page.goto("http://localhost:3001", timeout=5000)
        except:
             page.goto("http://localhost:3002", timeout=5000)

    page.evaluate("localStorage.setItem('quizCompleted', 'true')")
    page.reload()

    # Check if we are already logged in (Watchlist visible)
    try:
        if page.get_by_placeholder("What movie should we watch?").is_visible(timeout=2000):
            print("Already on watchlist screen")
        else:
            # Wait for user selection
            aaron_btn = page.get_by_role("button", name="Aaron")
            if aaron_btn.is_visible(timeout=3000):
                aaron_btn.click()
                print("Clicked Aaron")
            else:
                 # Try clicking by exact text if strict button not found
                 page.get_by_text("Aaron").click()
                 print("Clicked Aaron (text)")

            page.wait_for_timeout(2000)
    except Exception as e:
        print(f"User selection check/action failed: {e}")

    # Verify Watchlist
    try:
        expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible(timeout=10000)
        print("Watchlist input visible")
    except:
        print("Watchlist input NOT visible.")
        return

    # Add a movie
    unique_title = f"Perf Test {int(time.time())}"
    page.get_by_placeholder("What movie should we watch?").fill(unique_title)
    page.get_by_role("button", name="Add movie to watchlist").click()

    # Wait for the movie TITLE to appear (avoiding toast)
    # The movie title is usually in a heading or specific class
    # The error showed: <h3 class="movie-title">...</h3>
    expect(page.get_by_role("heading", name=unique_title)).to_be_visible()

    print(f"Added movie: {unique_title}")

    page.screenshot(path="verification/watchlist_verification.png")
    print("Screenshot saved to verification/watchlist_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Handle dialogs automatically (accept them)
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            verify_watchlist(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
