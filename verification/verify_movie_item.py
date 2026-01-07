from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # 1. Login
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        try:
             page.get_by_role("button", name="Skip quiz and go to user selection").click(timeout=3000)
             print("Clicked Skip button")
        except:
             print("No skip button found")

        print("Selecting user Aaron...")
        try:
            page.wait_for_selector("button", timeout=5000)
            page.get_by_role("button", name="Select Aaron as user").click(timeout=3000)
        except:
            if page.get_by_role("button", name="Switch User").is_visible():
                 print("Already logged in")
            else:
                 try:
                    page.get_by_role("button", name="Aaron", exact=True).click(timeout=3000)
                 except:
                    print("Failed to click Aaron button")
                    raise

        print("Waiting for movie list...")
        expect(page.get_by_placeholder("What movie should we watch?")).to_be_visible(timeout=10000)

        # 2. Add a movie
        print("Adding movie 'Performance Test Movie'...")
        page.get_by_placeholder("What movie should we watch?").fill("Performance Test Movie")
        page.get_by_role("button", name="Add movie to watchlist").click()

        expect(page.get_by_text('"Performance Test Movie" added successfully!')).to_be_visible()

        # 3. Toggle watched
        print("Toggling watched status...")

        # NOTE: Previous error said "Strict mode violation ... resolved to 2 elements".
        # This implies "Performance Test Movie" appears twice?
        # Or maybe the filter is too broad.
        # But we just added it.
        # It's possible the app duplicates it or something? Or maybe the skeleton loader?
        # Let's use .first() to resolve ambiguity if duplicate exists,
        # but logically there should be one.

        movie_card = page.locator(".movie-card").filter(has_text="Performance Test Movie").first

        toggle_btn = movie_card.locator("button[title='Mark as watched']")
        toggle_btn.click()

        # Verify toast message: "Marked ... as watched!"
        print("Verifying toast message...")
        expect(page.get_by_text('Marked "Performance Test Movie" as watched!')).to_be_visible()

        # Wait for toast to disappear or verify UI update
        # Button should now say "Mark as unwatched"
        expect(movie_card.locator("button[title='Mark as unwatched']")).to_be_visible()

        # 4. Take screenshot
        print("Taking screenshot...")
        time.sleep(1)
        page.screenshot(path="verification/movie_item_verified.png")

        # 5. Clean up
        print("Cleaning up...")
        delete_btn = movie_card.locator("button[title*='Delete']")

        page.on("dialog", lambda dialog: dialog.accept())
        delete_btn.click()

        expect(page.get_by_text('"Performance Test Movie" deleted')).to_be_visible()

        browser.close()
        print("Verification complete!")

if __name__ == "__main__":
    run()
