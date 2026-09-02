import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // get inner text of the body
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('body.html', bodyHTML);
  
  await browser.close();
})();
