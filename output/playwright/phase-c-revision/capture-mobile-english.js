async page => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('http://localhost:3456/#/cards-samples');
  await page.reload();
  await page.locator('.prototype-card[data-rarity="UR"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.locator('#cardZoomClose').evaluate(element => element.blur());
  await page.mouse.move(340, 780, { steps: 2 });
  await page.screenshot({ path: 'detail-ur-mobile-360.png', scale: 'css' });
  await page.locator('.prototype-detail__encouragement').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await page.locator('#cardZoomClose').evaluate(element => element.blur());
  await page.mouse.move(340, 780, { steps: 2 });
  await page.waitForTimeout(180);
  await page.screenshot({ path: 'detail-ur-bilingual-mobile-360.png', scale: 'css' });
  return await page.evaluate(() => ({
    viewport: `${innerWidth}x${innerHeight}`,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    quote: document.querySelector('.prototype-detail__encouragement').innerText,
    englishVisible: (() => {
      const node = document.querySelector('.prototype-detail__encouragement-en');
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    })(),
  }));
}
