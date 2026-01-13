from playwright.sync_api import sync_playwright

def debug_page_content():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Take a screenshot to see what's rendering
        page.screenshot(path="verification/debug_initial_load.png")

        # Print the page content (HTML)
        content = page.content()
        print(content)

        browser.close()

if __name__ == "__main__":
    debug_page_content()
