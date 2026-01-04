import time
import sys
from playwright.sync_api import sync_playwright, expect

def verify_movie_list_performance_and_ui(page):
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    # Wait for initial load
    page.wait_for_timeout(2000)

    # Handle Intro/Quiz
    print("Checking for intro...")
    try:
        skip_btn = page.get_by_role("button", name="Skip for Now")
        if skip_btn.is_visible():
            print("Found 'Skip for Now' button, clicking...")
            skip_btn.click()
            page.wait_for_timeout(1000)
        else:
            skip_text = page.get_by_text("Skip for Now")
            if skip_text.is_visible():
                 print("Found 'Skip for Now' text, clicking...")
                 skip_text.click()
                 page.wait_for_timeout(1000)
    except Exception as e:
        print(f"Intro check warning: {e}")

    # Login
    print("Attempting login...")
    page.screenshot(path="verification/login_screen.png")

    try:
        # Try specific accessible name first
        login_btn = page.get_by_role("button", name="Select Aaron as user")
        if login_btn.is_visible():
            login_btn.click()
        else:
            print("Accessible name button not found. Trying generic text 'Aaron'...")
            # Use exact text match for button-like element if possible, or just click the text
            page.get_by_text("Aaron", exact=True).click()

    except Exception as e:
        print(f"Login failed: {e}")
        raise e

    # Wait for watchlist
    print("Waiting for watchlist...")
    # Use a more specific selector or first() to avoid strict mode violation if multiple "Movies" text
    expect(page.get_by_text("Your movie list is empty").or_(page.get_by_text("Movies").first)).to_be_visible(timeout=10000)

    # Add movie
    print("Adding movie...")
    input_field = page.get_by_placeholder("What movie should we watch?")
    input_field.fill("Test Movie Performance")
    page.get_by_role("button", name="Add movie to watchlist").click()

    # Verify addition
    print("Verifying movie added...")
    # Expect the movie card heading, not the toast text
    expect(page.get_by_role("heading", name="Test Movie Performance").first).to_be_visible()

    # Screenshot of List
    print("Taking watchlist screenshot...")
    page.screenshot(path="verification/watchlist_ui.png")

    # Performance check (typing)
    input_field.fill("Typing Test")
    expect(input_field).to_have_value("Typing Test")

    # Toggle watched
    print("Toggling watched...")
    # Locate the card
    card = page.locator(".movie-card").filter(has_text="Test Movie Performance").first

    # Find toggle button (eye icon)
    # Using aria-label
    toggle_btn = card.get_by_label("Mark \"Test Movie Performance\" as watched").or_(
                 card.get_by_label("Mark \"Test Movie Performance\" as unwatched")).first

    toggle_btn.click()

    # Wait for toast
    expect(page.get_by_text("Updated status for \"Test Movie Performance\"")).to_be_visible()

    # Delete
    print("Deleting...")
    delete_btn = card.get_by_label("Delete \"Test Movie Performance\"").first
    page.on("dialog", lambda d: d.accept())
    delete_btn.click()

    # Verify deletion
    expect(page.get_by_text("\"Test Movie Performance\" deleted")).to_be_visible()

    print("Verification SUCCESS!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_movie_list_performance_and_ui(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/failure.png")
            sys.exit(1)
        finally:
            browser.close()
