async page => {
  await page.locator('.prototype-detail__encouragement').scrollIntoViewIfNeeded();
  await page.locator('#drawDetailBack').evaluate(element => element.blur());
  await page.mouse.move(345, 780, { steps: 2 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'draw-hidden-detail-bilingual-mobile-360.png', scale: 'css' });
  return await page.evaluate(() => {
    const english = document.querySelector('.prototype-detail__encouragement-en').getBoundingClientRect();
    return {
      quote: document.querySelector('.prototype-detail__encouragement').innerText,
      englishFullyVisible: english.top >= 0 && english.bottom <= innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}
