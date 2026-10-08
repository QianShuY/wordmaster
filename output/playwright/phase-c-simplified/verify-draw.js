async page => {
  const out = 'D:/工作区/wordmaster/output/playwright/phase-c-simplified';
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('http://localhost:3457/#/cards');
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('#drawCardBtn').waitFor({ state: 'visible' });
  const before = await page.evaluate(async () => {
    const [cards, copy] = await Promise.all([fetch('/api/cards').then(r => r.json()), fetch('/api/cards/copy', { cache: 'no-store' }).then(r => r.json())]);
    return { owned: cards.owned, answered: cards.today_answered, copyCount: Object.keys(copy).length, hiddenCopyLeaked: ['hawking','qingming','voyager'].some(key => key in copy) };
  });
  await page.locator('#drawCardBtn').evaluate(el => el.click());
  await page.locator('.draw-stage.has-unlock').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1100);
  const reveal = await page.evaluate(() => {
    const stage = document.querySelector('.draw-stage.has-unlock');
    const cards = [...stage.querySelectorAll('.draw-card')].map(card => ({ palette: card.dataset.palette, text: card.innerText, ratio: Number((card.getBoundingClientRect().width / card.getBoundingClientRect().height).toFixed(3)) }));
    const button = document.querySelector('#drawClose').getBoundingClientRect();
    return { viewport: innerWidth, pageWidth: document.documentElement.scrollWidth, cards, detailButtons: stage.querySelectorAll('[data-draw-detail]').length, knowledgeBlocks: stage.querySelectorAll('[class*=knowledge]').length, sourceLinks: stage.querySelectorAll('a').length, collect: { top: Math.round(button.top), bottom: Math.round(button.bottom), height: Math.round(button.height), inView: button.top >= 0 && button.bottom <= innerHeight } };
  });
  await page.screenshot({ path: `${out}/draw-hidden-mobile-360-simplified.png`, scale: 'css' });
  await page.locator('[data-draw-detail="1"]').evaluate(el => el.click());
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  const hiddenDetail = await page.evaluate(() => {
    const root = document.querySelector('.prototype-detail');
    return { title: root.querySelector('h2')?.textContent, chinese: root.querySelector('.prototype-detail__encouragement p:not(.prototype-detail__encouragement-en)')?.textContent, english: root.querySelector('.prototype-detail__encouragement-en')?.textContent, anchors: root.querySelectorAll('a').length, knowledge: root.querySelectorAll('[class*=knowledge]').length };
  });
  await page.screenshot({ path: `${out}/draw-hidden-detail-first-360-simplified.png`, scale: 'css' });
  await page.locator('.prototype-detail').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(100);
  await page.screenshot({ path: `${out}/draw-hidden-detail-bilingual-mobile-360-simplified.png`, scale: 'css' });
  await page.locator('#drawDetailBack').evaluate(el => el.click());
  await page.locator('.draw-stage.has-unlock').waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
  const collectNow = await page.evaluate(() => { const r = document.querySelector('#drawClose').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), inView: r.top >= 0 && r.bottom <= innerHeight }; });
  await page.locator('#drawClose').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${out}/draw-hidden-mobile-collect-360-simplified.png`, scale: 'css' });
  await page.locator('#drawClose').evaluate(el => el.click());
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  const after = await page.evaluate(async () => {
    const [cards, copy] = await Promise.all([fetch('/api/cards').then(r => r.json()), fetch('/api/cards/copy', { cache: 'no-store' }).then(r => r.json())]);
    return { owned: cards.owned, hiddenOwned: cards.cards.filter(card => card.hidden && card.owned).map(card => card.palette), copyCount: Object.keys(copy).length, hiddenCopyNowVisible: 'hawking' in copy };
  });
  return { before, reveal, hiddenDetail, collectNow, after };
}
