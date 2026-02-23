from playwright.sync_api import sync_playwright

def test_messages_header():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--disable-web-security'])
        page = browser.new_page()

        # Subscribe to console messages
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5002", timeout=60000)

            print("Waiting for network idle...")
            page.wait_for_load_state("networkidle", timeout=60000)

            print("Looking for Open messages button...")
            try:
                # Try to find the floating bubble
                button = page.get_by_label("Open messages")
                if button.is_visible():
                    print("Found Open messages button. Clicking...")
                    button.click()
                    # Wait for animation/expansion
                    page.wait_for_timeout(2000)
                else:
                    print("Open messages button not visible.")
            except Exception as e:
                print(f"Could not interact with Open messages button: {e}")

            # Dump content again
            with open("verification/page_content_expanded.html", "w") as f:
                f.write(page.content())

            page.screenshot(path="verification/messages_expanded.png")

            content = page.content()
            if "MESSAGES" in content:
                print("Found 'MESSAGES' in content (Main Header).")
            else:
                print("Did NOT find 'MESSAGES' in content.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_messages_header()
