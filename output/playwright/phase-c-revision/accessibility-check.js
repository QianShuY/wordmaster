async page => {
  await page.goto('http://localhost:3456/#/cards-samples');
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const card = page.locator('.prototype-card[data-rarity="SR"]');
  await card.focus();
  await page.keyboard.press('Enter');
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  const opened = await page.evaluate(() => ({
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    cardAnimationDuration: getComputedStyle(document.querySelector('.prototype-card')).animationDuration,
    foilStaticOpacity: getComputedStyle(document.querySelector('.prototype-card[data-rarity="SR"] .prototype-card__foil')).opacity,
    modalOpen: !document.querySelector('#cardModal').classList.contains('hidden'),
    illustrationLoaded: document.querySelector('.prototype-detail__art .gc-photo').naturalWidth > 0,
  }));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  const closed = await page.evaluate(() => ({
    modalClosed: document.querySelector('#cardModal').classList.contains('hidden'),
    focusReturned: document.activeElement.matches('.prototype-card[data-rarity="SR"]'),
    backgroundScrollRestored: getComputedStyle(document.documentElement).overflow !== 'hidden',
  }));
  return { opened, closed };
}
