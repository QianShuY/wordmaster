async page => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('http://localhost:3456/#/cards-preview');
  await page.reload();
  await page.locator('.prototype-card[data-palette="tetris"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.locator('#cardZoomClose').evaluate(element => element.blur());
  const firstView = await page.evaluate(() => {
    const rect = document.querySelector('.prototype-detail__art').getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      artVisibleFirst: rect.top >= 0 && rect.bottom <= innerHeight,
      artBox: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) },
    };
  });
  await page.screenshot({ path: 'detail-tetris-mobile-360.png', scale: 'css' });
  await page.locator('.prototype-detail__encouragement').scrollIntoViewIfNeeded();
  await page.locator('#cardZoomClose').evaluate(element => element.blur());
  await page.mouse.move(345, 780, { steps: 2 });
  await page.waitForTimeout(120);
  const quoteView = await page.evaluate(() => {
    const english = document.querySelector('.prototype-detail__encouragement-en').getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      englishVisible: english.top >= 0 && english.bottom <= innerHeight,
      englishText: document.querySelector('.prototype-detail__encouragement-en').textContent,
    };
  });
  await page.screenshot({ path: 'detail-tetris-bilingual-mobile-360.png', scale: 'css' });
  await page.keyboard.press('Escape');
  return { firstView, quoteView };
}
