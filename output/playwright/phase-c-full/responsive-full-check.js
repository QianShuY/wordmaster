async page => {
  await page.goto('http://localhost:3456/#/cards-preview');
  await page.waitForFunction(() => document.querySelectorAll('#cardsGrid .prototype-card').length === 62);
  const results = [];
  for (const [width, height] of [[360, 800], [390, 844], [430, 932], [844, 390], [768, 1024], [1024, 768], [1440, 1024]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(120);
    results.push(await page.evaluate(() => {
      const root = document.documentElement;
      const grid = document.querySelector('#cardsGrid');
      const first = grid.querySelector('.prototype-card');
      const box = first.getBoundingClientRect();
      const art = first.querySelector('.prototype-card__art').getBoundingClientRect();
      return {
        viewport: `${innerWidth}x${innerHeight}`,
        horizontalOverflow: root.scrollWidth > root.clientWidth || document.body.scrollWidth > document.body.clientWidth,
        cardCount: grid.querySelectorAll('.prototype-card').length,
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        ratio: Number((box.width / box.height).toFixed(3)),
        fullBleedArt: Math.abs(box.width - art.width) <= 2 && Math.abs(box.height - art.height) <= 2,
      };
    }));
  }
  await page.setViewportSize({ width: 1440, height: 1024 });
  return results;
}
