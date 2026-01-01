from playwright.sync_api import sync_playwright
import time

def verify_button_loading_state():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        context.add_init_script("""
            localStorage.setItem('quizCompleted', 'true');
            localStorage.setItem('movieListSeeded_gist_refactored', 'true');
        """)

        page = context.new_page()
        page.goto("http://localhost:3002")

        page.wait_for_selector("body")

        # Select user Aaron
        page.locator("button").filter(has_text="Aaron").first.click()

        # Wait for input field to be visible
        input_field = page.get_by_placeholder("What movie should we watch?")
        input_field.wait_for(state="visible", timeout=10000)
        input_field.fill("Test Loading")

        # Setup route to hang
        def handle_route(route):
            time.sleep(2)
            try:
                route.continue_()
            except:
                pass

        page.route("**/gists/**", handle_route)

        add_btn = page.get_by_label("Add movie to watchlist")
        add_btn.click()

        # Wait for spinner
        try:
            spinner = page.locator("svg.animate-spin")
            spinner.wait_for(timeout=5000)
            print("Spinner found!")
        except Exception as e:
            print(f"Spinner NOT found: {e}")
            page.screenshot(path="verification/debug_fail.png")

        # Take screenshot of the form area
        form = page.locator("form.add-movie-form")
        form.screenshot(path="verification/verify_button_loading.png")

        browser.close()

if __name__ == "__main__":
    verify_button_loading_state()
