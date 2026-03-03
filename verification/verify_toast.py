from playwright.sync_api import sync_playwright, expect

def test_toast_styles(page):
    page.goto("http://localhost:8081")

    # Wait for the UserSelection component to be loaded
    page.wait_for_selector("text=Who's watching", timeout=10000)

    # Take a screenshot to verify app loads and doesn't crash from Toast.tsx changes
    page.screenshot(path="verification/toast_verify.png")
    print("Screenshot saved to verification/toast_verify.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_toast_styles(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
