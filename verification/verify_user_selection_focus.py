from playwright.sync_api import sync_playwright, expect
import time

def verify_user_selection_focus():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to the app (using port 3000 as discovered)
            page.goto("http://localhost:3000")

            # 1. Skip the Intro Screen
            # Look for the skip button
            skip_btn = page.get_by_label("Skip quiz and go to user selection")
            if skip_btn.is_visible():
                print("Found Skip button, clicking...")
                skip_btn.click()
            else:
                print("Skip button not found, assuming already on User Selection or similar.")

            # 2. Wait for User Selection buttons to appear
            aaron_btn = page.get_by_label("Select Aaron as user")
            electra_btn = page.get_by_label("Select Electra as user")

            expect(aaron_btn).to_be_visible(timeout=10000)

            print("User selection buttons found.")

            # Initial screenshot (no focus)
            page.screenshot(path="verification/user_selection_initial.png")
            print("Captured initial state.")

            # Focus on Aaron
            print("Focusing on Aaron...")
            aaron_btn.focus()

            # Wait for potential state update/animation
            time.sleep(1)

            # Capture screenshot with Aaron focused
            page.screenshot(path="verification/user_selection_focus_aaron.png")
            print("Captured Aaron focus state.")

            # Focus on Electra
            print("Focusing on Electra...")
            electra_btn.focus()

            time.sleep(1)

            # Capture screenshot with Electra focused
            page.screenshot(path="verification/user_selection_focus_electra.png")
            print("Captured Electra focus state.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_user_selection.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_user_selection_focus()
