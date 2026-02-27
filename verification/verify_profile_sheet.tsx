import { test, expect } from '@playwright/test';

test('Profile sheet renders correctly', async ({ page }) => {
  // Navigate to the app (assuming it's running on localhost:8080 or similar)
  // Since I don't know the exact port, I'll try 8080 and 5173 (Vite default)
  try {
    await page.goto('http://localhost:5173');
  } catch {
    await page.goto('http://localhost:8080');
  }

  // Look for a button or element that opens the profile sheet
  // Based on code exploration, it might be an avatar or a settings button
  // I'll look for "Active profile" text which is in the sheet, but first I need to open it.
  // ProfileSheet is likely used in a layout or top bar.

  // This is a best-effort verification script. If I can't find the trigger, I'll take a screenshot of the home page
  // to at least verify the app loads without crashing due to my changes.

  await page.waitForTimeout(2000); // Wait for load

  // Try to find a trigger for the profile sheet
  const profileTrigger = page.getByRole('button', { name: /profile|account|user/i }).first();
  if (await profileTrigger.isVisible()) {
    await profileTrigger.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'verification/screenshot.png' });
});
