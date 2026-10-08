async page => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('http://localhost:3456/#/cards-samples');
  await page.locator('.prototype-card[data-rarity="R"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.mouse.move(1360, 950, { steps: 4 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'detail-r.png', scale: 'css' });
  return { title: await page.locator('.prototype-detail h2').textContent(), focus: await page.evaluate(() => document.activeElement.id) };
}
