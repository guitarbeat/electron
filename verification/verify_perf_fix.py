from playwright.sync_api import sync_playwright, expect
import time

def verify_watchlist(page):
    # Navigate to the app
    page.goto("http://localhost:3000")

    # Handle Intro screen if present
    try:
        # Wait a bit for intro to possibly appear
        time.sleep(1)
        # Try to find the skip button if we are on intro
        skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
        if skip_button.is_visible():
            skip_button.click()
            print("Clicked skip button")
    except Exception as e:
        print(f"Intro skip check: {e}")

    # Select user (Aaron)
    # The screenshot shows the "Who's Watching?" screen.
    # The buttons have text "Aaron" and "Electra".
    try:
        page.get_by_role("button", name="Select Aaron as user").click(timeout=5000)
        print("Selected Aaron")
    except Exception as e:
        print(f"User selection check: {e}")

    # Wait for watchlist to load
    # We look for something that indicates watchlist. "Your movie list" or a movie card.
    try:
        page.wait_for_selector(".movie-card", timeout=10000)
    except:
        # If list is empty, we might see "Your movie list is empty"
        if page.get_by_text("Your movie list is empty").is_visible():
            print("Movie list is empty")
        else:
            raise

    # Take a screenshot of the initial list
    page.screenshot(path="verification/watchlist_initial.png")
    print("Initial screenshot taken")

    # Test typing in the input
    page.get_by_placeholder("What movie should we watch?").fill("Test Movie")

    # Verify the input has value
    expect(page.get_by_placeholder("What movie should we watch?")).to_have_value("Test Movie")

    page.screenshot(path="verification/watchlist_typing.png")
    print("Typing screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_watchlist(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_2.png")
        finally:
            browser.close()
