import sys
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    print("Page loaded")
    page.wait_for_selector(".transition-container", timeout=10000)

    # Handle Quiz
    if page.is_visible("text=Skip for Now"):
        print("Quiz detected. Clicking Skip for Now...")
        page.click("text=Skip for Now")
        page.wait_for_timeout(1000)

    # Handle User Selection
    if page.is_visible("text=Who's Watching?"):
        print("User selection detected. Clicking Aaron...")
        # Use exact text or safer selector if possible
        page.click("button:has-text(\"Aaron\")")
        page.wait_for_timeout(1000)

    # Wait for watchlist
    print("Waiting for watchlist...")
    try:
        # Check for empty state or list
        page.wait_for_selector(".movie-card, .add-movie-form", timeout=15000)
        print("Watchlist loaded.")
        page.screenshot(path="verification/watchlist.png")
    except Exception as e:
        print(f"Watchlist wait error: {e}")
        page.screenshot(path="verification/final_error.png")
        # Dump content to see what is happening
        with open("verification/page_content.html", "w") as f:
            f.write(page.content())
        raise e

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
