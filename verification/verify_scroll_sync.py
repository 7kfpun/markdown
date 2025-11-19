
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto("http://localhost:5173")

        # Scroll the editor
        await page.mouse.move(300, 300)
        await page.mouse.wheel(0, 500)
        await asyncio.sleep(1)

        await page.screenshot(path="verification/scroll-sync.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
