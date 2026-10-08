async page => {
  await page.goto('http://localhost:3456/#/cards');
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('#cardsGrid .prototype-card').length === 62);
  const hiddenFileStatus = (await page.request.get('http://localhost:3456/cards/card-copy.hidden.json')).status();
  return await page.evaluate(async hiddenFileStatus => {
    const [cards, content, publicFile] = await Promise.all([
      fetch('/api/cards').then(r => r.json()),
      fetch('/api/cards/copy', { cache: 'no-store' }).then(r => r.json()),
      fetch('/cards/card-copy.json').then(r => r.json()),
    ]);
    const hiddenPalettes = ['hawking', 'qingming', 'voyager'];
    const lockedHidden = cards.cards.filter(card => card.hidden && !card.owned);
    const grid = document.querySelector('#cardsGrid');
    return {
      cardCount: cards.cards.length,
      owned: cards.owned,
      lockedCount: grid.querySelectorAll('.prototype-card--locked').length,
      lockedImages: grid.querySelectorAll('.prototype-card--locked img').length,
      hiddenLockedCount: lockedHidden.length,
      hiddenNamesInRenderedPage: ['仰望星空', '河桥长卷', '星海留声'].filter(title => grid.innerText.includes(title)),
      visibleCopyCount: Object.keys(content).length,
      hiddenInApi: hiddenPalettes.filter(palette => palette in content),
      hiddenInPublicJson: hiddenPalettes.filter(palette => palette in publicFile),
      hiddenFileHttpStatus: hiddenFileStatus,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  }, hiddenFileStatus);
}
