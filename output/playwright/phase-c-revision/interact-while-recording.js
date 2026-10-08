async page => {
  const moveWithin = async (selector, x, y, ms = 500) => {
    const box = await page.locator(selector).boundingBox();
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 12 });
    await page.waitForTimeout(ms);
  };

  await moveWithin('.prototype-card[data-rarity="R"]', .28, .34);
  await moveWithin('.prototype-card[data-rarity="R"]', .76, .58);
  await moveWithin('.prototype-card[data-rarity="SR"]', .3, .3);
  await moveWithin('.prototype-card[data-rarity="SR"]', .76, .45);
  await moveWithin('.prototype-card[data-rarity="UR"]', .35, .32);
  await moveWithin('.prototype-card[data-rarity="UR"]', .78, .2);

  await page.locator('.prototype-card[data-rarity="SR"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.waitForTimeout(850);
  await moveWithin('.prototype-detail__art', .32, .3, 450);
  await moveWithin('.prototype-detail__art', .76, .55, 450);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  await page.waitForTimeout(350);

  await page.locator('.prototype-card[data-rarity="UR"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.waitForTimeout(800);
  await moveWithin('.prototype-detail__art', .45, .2, 450);
  await moveWithin('.prototype-detail__art', .8, .5, 450);
  const quote = page.locator('.prototype-detail__encouragement-en');
  if (!(await quote.isVisible())) await quote.scrollIntoViewIfNeeded();
  await page.waitForTimeout(850);
  const englishVisible = await quote.isVisible();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  return { englishVisible, focusReturned: await page.evaluate(() => document.activeElement.matches('.prototype-card[data-rarity="UR"]')) };
}
