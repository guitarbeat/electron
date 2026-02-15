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

        # 5. Check computed style
        transform = button.evaluate("el => getComputedStyle(el).transform")
        print(f"Transform style: {transform}")

        # Assert failure if transform is none or identity matrix
        if transform == "none" or transform == "matrix(1, 0, 0, 1, 0, 0)":
            print("FAILURE: Button does not have transform style on focus.")
            exit(1)

        print("SUCCESS: Button has transform style on focus.")
        browser.close()


if __name__ == "__main__":
    run()
