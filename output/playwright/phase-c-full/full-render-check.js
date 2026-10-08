async page => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('http://localhost:3456/#/cards');
  await page.reload();
  await page.locator('#cardsGrid .prototype-card').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(250);
  const lockedState = await page.evaluate(async () => {
    const [cards, content] = await Promise.all([
      fetch('/api/cards').then(r => r.json()),
      fetch('/api/cards/copy', { cache: 'no-store' }).then(r => r.json()),
    ]);
    const grid = document.querySelector('#cardsGrid');
    const hiddenTitles = ['仰望星空', '河桥长卷', '星海留声'];
    return {
      cards: cards.cards.length,
      uniqueIds: new Set(cards.cards.map(c => c.id)).size,
      ownedFromApi: cards.owned,
      gridCards: grid.querySelectorAll('.prototype-card').length,
      ownedButtons: grid.querySelectorAll('button.prototype-card').length,
      lockedCards: grid.querySelectorAll('.prototype-card--locked').length,
      lockedImages: grid.querySelectorAll('.prototype-card--locked img').length,
      hiddenLocked: cards.cards.filter(c => c.hidden && !c.owned).length,
      visibleCopyEntries: Object.keys(content).length,
      hiddenNamesInGrid: hiddenTitles.filter(title => grid.innerText.includes(title)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  await page.goto('http://localhost:3456/#/cards-preview');
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('#cardsGrid .prototype-card').length === 62);
  await page.waitForTimeout(400);
  await page.mouse.move(1360, 950, { steps: 3 });
  await page.screenshot({ path: 'cards-62-desktop.png', scale: 'css' });
  await page.screenshot({ path: 'cards-62-desktop-full.png', fullPage: true, scale: 'css' });
  const desktop = await page.evaluate(() => {
    const grid = document.querySelector('#cardsGrid');
    const first = grid.querySelector('.prototype-card');
    const box = first.getBoundingClientRect();
    return {
      cards: grid.querySelectorAll('.prototype-card').length,
      artCoversFace: Math.abs(box.width - first.querySelector('.prototype-card__art').getBoundingClientRect().width) <= 2,
      ratio: Number((box.width / box.height).toFixed(3)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'cards-62-mobile-360.png', scale: 'css' });
  const mobile = await page.evaluate(() => ({
    width: innerWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    columns: getComputedStyle(document.querySelector('#cardsGrid')).gridTemplateColumns.split(' ').length,
    visibleCards: [...document.querySelectorAll('#cardsGrid .prototype-card')].filter(c => c.getBoundingClientRect().top < innerHeight).length,
  }));

  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.locator('.prototype-card[data-palette="tetris"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.mouse.move(1360, 950, { steps: 3 });
  await page.waitForTimeout(500);
  const tetris = {
    title: await page.locator('.prototype-detail h2').textContent(),
    label: await page.locator('.prototype-detail__knowledge h3').textContent(),
    source: await page.locator('.prototype-detail__source').getAttribute('href'),
    english: await page.locator('.prototype-detail__encouragement-en').textContent(),
  };
  await page.screenshot({ path: 'detail-tetris.png', scale: 'css' });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  await page.locator('.prototype-card[data-palette="pixel"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.mouse.move(1360, 950, { steps: 3 });
  await page.waitForTimeout(450);
  const fiction = {
    title: await page.locator('.prototype-detail h2').textContent(),
    label: await page.locator('.prototype-detail__knowledge h3').textContent(),
    sourceNote: await page.locator('.prototype-detail__source').textContent(),
  };
  await page.screenshot({ path: 'detail-pixel-inspiration.png', scale: 'css' });
  await page.keyboard.press('Escape');
  return { lockedState, desktop, mobile, tetris, fiction };
}
