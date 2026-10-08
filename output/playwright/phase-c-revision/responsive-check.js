async page => {
  await page.reload();
  const close = page.locator('#cardZoomClose');
  if (await close.count()) await close.click();
  const results = [];
  for (const [width, height] of [[360, 800], [390, 844], [430, 932], [844, 390], [768, 1024], [1024, 768], [1440, 1024]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(120);
    results.push(await page.evaluate(() => {
      const root = document.documentElement;
      const grid = document.querySelector('#cardsGrid');
      const card = grid?.querySelector('.prototype-card');
      const cardBox = card?.getBoundingClientRect();
      const art = card?.querySelector('.prototype-card__art');
      const artBox = art?.getBoundingClientRect();
      return {
        viewport: `${innerWidth}x${innerHeight}`,
        horizontalOverflow: root.scrollWidth > root.clientWidth || document.body.scrollWidth > document.body.clientWidth,
        sampleCards: grid?.querySelectorAll('.prototype-card').length || 0,
        cardRatio: cardBox ? Number((cardBox.width / cardBox.height).toFixed(3)) : null,
        artFillsCard: !!cardBox && !!artBox && Math.abs(cardBox.width - artBox.width) <= 2 && Math.abs(cardBox.height - artBox.height) <= 2,
        imagesLoaded: [...(grid?.querySelectorAll('.gc-photo') || [])].every(img => img.complete && img.naturalWidth > 0),
      };
    }));
  }
  await page.setViewportSize({ width: 1440, height: 1024 });
  return results;
}
