import os
import time
from playwright.sync_api import sync_playwright

def capture_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:5000/")
        page.wait_for_load_state("networkidle")

        # Give it a moment to render
        time.sleep(2)

        # Take a screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        screenshot_path = "/home/jules/verification/dashboard.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    capture_dashboard()
