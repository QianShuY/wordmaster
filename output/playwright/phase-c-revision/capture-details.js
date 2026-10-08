async page => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('http://localhost:3456/#/cards-samples');
  await page.reload();
  const files = [];
  for (const sample of [
    ['N', 'detail-n.png'], ['R', 'detail-r.png'],
    ['SR', 'detail-sr-desktop.png'], ['UR', 'detail-ur.png'],
  ]) {
    const [rarity, filename] = sample;
    await page.locator(`.prototype-card[data-rarity="${rarity}"]`).click();
    await page.locator('.prototype-detail').waitFor({ state: 'visible' });
    await page.mouse.move(1360, 950, { steps: 3 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: filename, scale: 'css' });
    files.push({
      rarity,
      filename,
      englishEncouragement: await page.locator('.prototype-detail__encouragement-en').textContent(),
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  }
  return files;
}
