async page => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3456/#/cards-samples');
  await page.locator('.prototype-card[data-rarity="UR"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(450);

  await page.screencast.start({ path: 'rarity-interaction.webm', size: { width: 1280, height: 800 }, fps: 24 });
  await page.screencast.showActions({
    cursor: 'pointer', duration: 700, position: 'top-right',
    style: {
      point: 'width: 13px; height: 13px; border-radius: 50%; background: rgba(194,64,42,.88); box-shadow: 0 0 0 3px rgba(255,253,248,.9)',
      title: 'display: none',
    },
  });
  await page.waitForTimeout(650);

  const moveWithin = async (selector, x, y) => {
    const box = await page.locator(selector).boundingBox();
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 12 });
    await page.waitForTimeout(550);
  };

  await moveWithin('.prototype-card[data-rarity="R"]', .28, .34);
  await moveWithin('.prototype-card[data-rarity="SR"]', .28, .3);
  await moveWithin('.prototype-card[data-rarity="SR"]', .77, .42);
  await moveWithin('.prototype-card[data-rarity="UR"]', .35, .34);
  await moveWithin('.prototype-card[data-rarity="UR"]', .78, .2);

  await page.locator('.prototype-card[data-rarity="SR"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.waitForTimeout(1100);
  await moveWithin('.prototype-detail__art', .35, .32);
  await moveWithin('.prototype-detail__art', .74, .55);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  await page.waitForTimeout(450);

  await page.locator('.prototype-card[data-rarity="UR"]').click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  await page.waitForTimeout(1300);
  await moveWithin('.prototype-detail__art', .45, .2);
  await moveWithin('.prototype-detail__art', .8, .55);
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#cardModal').classList.contains('hidden'));
  await page.waitForTimeout(500);
  await page.screencast.hideActions();
  await page.screencast.stop();
  return 'Recorded SR/UR static surfaces, pointer shift, detail open/close, and source copy.';
}
