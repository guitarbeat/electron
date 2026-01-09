
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to app
        await page.goto("http://localhost:3000")

        # Handle intro if present
        try:
            skip_button = page.get_by_role("button", name="Skip quiz and go to user selection")
            if await skip_button.is_visible(timeout=2000):
                await skip_button.click()
        except:
            pass

        # Select user
        try:
            await page.get_by_role("button", name="Select Aaron as user").click(timeout=5000)
        except:
            print("Could not find user selection button")

        # Wait for watchlist
        try:
            await page.wait_for_selector('input[placeholder="What movie should we watch?"]', timeout=10000)
        except:
            print("Watchlist did not load")
            return

        # Take screenshot
        await page.screenshot(path="verification/watchlist.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
