import time
from playwright.sync_api import sync_playwright, expect


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Navigate to the app
        page.goto("http://localhost:5000")

        # 2. Reset quiz state to show IntroScreen
        page.evaluate("localStorage.setItem('quizCompleted', 'false')")
        page.reload()

        # 3. Locate the button
        button = page.get_by_label("Start the personality quiz")
        expect(button).to_be_visible()

        # 4. Focus the button
        button.focus()

        # Wait a bit for React/browser to apply styles
        time.sleep(0.5)

        # 5. Take screenshot
        page.screenshot(path="verification/button_focus.png")
        print("Screenshot saved to verification/button_focus.png")

        browser.close()


if __name__ == "__main__":
    run()
