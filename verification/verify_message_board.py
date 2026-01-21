from playwright.sync_api import Page, expect, sync_playwright

def verify_message_board(page: Page):
    page.goto("http://localhost:3000")

    # Skip Intro
    page.get_by_label("Skip quiz and go to user selection").click()

    # Verify Message Board is visible on User Selection screen
    expect(page.get_by_text("Electra & Aaron's Chat Room")).to_be_visible()

    # Select User (e.g., Aaron)
    page.get_by_label("Select Aaron as user").click()

    # Verify Watchlist loads (meaning we transitioned successfully)
    expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible()

    # Take screenshot of the Watchlist + Message Board
    page.screenshot(path="verification/message_board_full_flow.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_message_board(page)
        finally:
            browser.close()
