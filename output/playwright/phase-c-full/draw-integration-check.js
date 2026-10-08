async page => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('http://localhost:3457/#/cards');
  await page.locator('#drawCardBtn').waitFor({ state: 'visible' });
  const before = await page.evaluate(async () => {
    const [cards, copy] = await Promise.all([
      fetch('/api/cards').then(r => r.json()),
      fetch('/api/cards/copy', { cache: 'no-store' }).then(r => r.json()),
    ]);
    return {
      owned: cards.owned,
      answered: cards.today_answered,
      drawnToday: cards.drawn_today,
      copyCount: Object.keys(copy).length,
      hiddenCopyLeaked: ['hawking', 'qingming', 'voyager'].some(p => p in copy),
    };
  });

  await page.locator('#drawCardBtn').click();
  await page.locator('.draw-stage.has-unlock').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'draw-hidden-mobile-360.png', scale: 'css' });
  const reveal = await page.evaluate(() => {
    const stage = document.querySelector('.draw-stage.has-unlock');
    const cards = [...stage.querySelectorAll('.draw-card')].map(card => {
      const rect = card.getBoundingClientRect();
      const story = card.parentElement.querySelector('.prototype-detail__story').getBoundingClientRect();
      return { rarity: card.dataset.rarity, palette: card.dataset.palette, artTop: Math.round(rect.top), storyTop: Math.round(story.top), sourceVisible: !!card.parentElement.querySelector('.prototype-detail__source') };
    });
    const close = document.querySelector('#drawClose').getBoundingClientRect();
    return {
      results: cards,
      incomeButton: { top: Math.round(close.top), bottom: Math.round(close.bottom), viewport: innerHeight },
      copyOrderArtBeforeStory: cards.every(card => card.artTop < card.storyTop),
    };
  });
  await page.locator('#drawClose').scrollIntoViewIfNeeded();
  const incomeButtonReachable = await page.evaluate(() => {
    const r = document.querySelector('#drawClose').getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  await page.screenshot({ path: 'draw-hidden-mobile-collect-360.png', scale: 'css' });
  await page.locator('#drawClose').click();
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  await page.waitForTimeout(350);

  const after = await page.evaluate(async () => {
    const [cards, copy] = await Promise.all([
      fetch('/api/cards').then(r => r.json()),
      fetch('/api/cards/copy', { cache: 'no-store' }).then(r => r.json()),
    ]);
    return {
      owned: cards.owned,
      ownedHidden: cards.cards.filter(c => c.hidden && c.owned).map(c => c.palette),
      visibleCopyCount: Object.keys(copy).length,
      unlockedCopy: 'hawking' in copy,
    };
  });

  await page.locator('button.prototype-card[data-palette="hawking"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  const hiddenDetail = {
    title: await page.locator('.prototype-detail h2').textContent(),
    label: await page.locator('.prototype-detail__knowledge h3').textContent(),
    source: await page.locator('.prototype-detail__source').getAttribute('href'),
  };
  await page.keyboard.press('Escape');
  return { before, reveal, incomeButtonReachable, after, hiddenDetail };
}
