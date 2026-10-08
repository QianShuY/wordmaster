async page => {
  const out = 'D:/工作区/wordmaster/output/playwright/phase-c-simplified';
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('http://localhost:3457/#/cards-preview');
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('#cardsGrid .prototype-card').length === 62);
  await page.waitForTimeout(250);
  const desktop = await page.evaluate(() => ({
    cardCount: document.querySelectorAll('#cardsGrid .prototype-card').length,
    previewCopyCount: Object.keys(window.__testCopy || {}).length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    links: document.querySelectorAll('#cardsGrid a').length,
  }));
  await page.screenshot({ path: `${out}/cards-62-desktop-simplified.png`, scale: 'css' });
  await page.screenshot({ path: `${out}/cards-62-desktop-full-simplified.png`, fullPage: true, scale: 'css' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${out}/cards-62-mobile-360-simplified.png`, scale: 'css' });
  const mobile = await page.evaluate(() => ({ width: innerWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, columns: getComputedStyle(document.querySelector('#cardsGrid')).gridTemplateColumns.split(' ').length }));
  await page.locator('.prototype-card[data-palette="tetris"]').evaluate(el => el.click());
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.screenshot({ path: `${out}/detail-bilingual-mobile-first-360.png`, scale: 'css' });
  const detailTop = await page.evaluate(() => {
    const root = document.querySelector('.prototype-detail');
    return { title: root.querySelector('h2')?.textContent, chinese: root.querySelector('.prototype-detail__encouragement p:not(.prototype-detail__encouragement-en)')?.textContent, english: root.querySelector('.prototype-detail__encouragement-en')?.textContent, knowledgeBlocks: root.querySelectorAll('[class*=knowledge]').length, sourceLinks: root.querySelectorAll('a').length, externalLinks: [...root.querySelectorAll('a[href]')].filter(a => /^https?:/i.test(a.href)).length };
  });
  await page.locator('.prototype-detail').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${out}/detail-bilingual-mobile-360.png`, scale: 'css' });
  await page.locator('#cardZoomClose').evaluate(el => el.click());
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.locator('.prototype-card[data-palette="tetris"]').evaluate(el => el.click());
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.screenshot({ path: `${out}/detail-bilingual-desktop.png`, scale: 'css' });
  const detailDesktop = await page.evaluate(() => ({ englishVisible: !!document.querySelector('.prototype-detail__encouragement-en'), knowledgeBlocks: document.querySelectorAll('.prototype-detail [class*=knowledge]').length, sourceLinks: document.querySelectorAll('.prototype-detail a').length, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
  return { desktop, mobile, detailTop, detailDesktop };
}
