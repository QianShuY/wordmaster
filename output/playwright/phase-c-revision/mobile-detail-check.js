async page => {
  await page.reload();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForSelector('.prototype-card[data-rarity="SR"]');
  await page.locator('.prototype-card[data-rarity="SR"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  return await page.evaluate(() => {
    const box = selector => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight };
    };
    return {
      viewportWidth: innerWidth,
      documentWidth: `${document.documentElement.scrollWidth}/${document.documentElement.clientWidth}`,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      bodyOverflow: getComputedStyle(document.body).overflow,
      modal: box('#cardModal'),
      detail: box('.prototype-detail'),
      poster: box('.prototype-detail__art'),
      story: box('.prototype-detail__story'),
      closeFocused: document.activeElement.id === 'cardZoomClose',
    };
  });
}
