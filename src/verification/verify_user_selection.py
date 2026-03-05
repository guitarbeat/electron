from playwright.sync_api import sync_playwright

def verify_user_selection():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to home
        page.goto("http://localhost:8080")

        # Wait for "Who's watching" section
        page.wait_for_selector("text=Who's watching", timeout=10000)

        # Verify avatars exist
        if page.is_visible('text=Aaron'):
            print("Aaron avatar found")
        if page.is_visible('text=Electra'):
            print("Electra avatar found")

        # Click Aaron to trigger PIN dialog (or selection)
        page.click('text=Aaron')

        # Wait a moment for potential dialog
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/user_selection.png")
        print("Screenshot saved to verification/user_selection.png")

        browser.close()

if __name__ == "__main__":
    verify_user_selection()
