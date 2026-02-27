from playwright.sync_api import sync_playwright

def verify_app_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:8080")

            # Wait for the main content to load
            page.wait_for_selector("#main-content", timeout=10000)

            # Take a screenshot to verify the app loaded correctly without the ProfileSheet
            page.screenshot(path="verification/app_load.png")
            print("Screenshot taken successfully")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_load()
