async page => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('http://localhost:3456/#/cards-samples');
  await page.reload();
  await page.locator('.prototype-card[data-rarity="UR"]').waitFor({ state: 'visible' });
  await page.mouse.move(1360, 950, { steps: 3 });
  await page.waitForTimeout(250);

  await page.screenshot({ path: 'cards-desktop.png', fullPage: true, scale: 'css' });
  await page.locator('.prototype-card[data-rarity="SR"]').screenshot({ path: 'rarity-sr-static.png', scale: 'css' });
  await page.locator('.prototype-card[data-rarity="UR"]').screenshot({ path: 'rarity-ur-static.png', scale: 'css' });

  const computed = async selector => page.locator(selector).evaluate(element => {
    const style = getComputedStyle(element);
    return {
      x: style.getPropertyValue('--foil-x').trim(),
      y: style.getPropertyValue('--foil-y').trim(),
      mask: getComputedStyle(element, '::before').maskImage,
    };
  });
  const moveTo = async (selector, x, y) => {
    const rect = await page.locator(selector).boundingBox();
    await page.mouse.move(rect.x + rect.width * x, rect.y + rect.height * y, { steps: 8 });
    await page.waitForTimeout(100);
    return computed(`${selector} .prototype-card__foil`);
  };

  const srSelector = '.prototype-card[data-rarity="SR"]';
  const srFoil = `${srSelector} .prototype-card__foil`;
  const srInitial = await computed(srFoil);
  const srFirstPointer = await moveTo(srSelector, .24, .66);
  const srSecondPointer = await moveTo(srSelector, .79, .37);
  await page.mouse.move(1360, 950, { steps: 5 });
  await page.waitForTimeout(100);
  const srRestored = await computed(srFoil);

  const urSelector = '.prototype-card[data-rarity="UR"]';
  const urFoil = `${urSelector} .prototype-card__foil`;
  const urInitial = await computed(urFoil);
  const urFirstPointer = await moveTo(urSelector, .31, .68);
  const urSecondPointer = await moveTo(urSelector, .76, .21);
  await page.mouse.move(1360, 950, { steps: 5 });
  await page.waitForTimeout(100);
  const urRestored = await computed(urFoil);

  await page.locator(urSelector).click();
  await page.locator('.prototype-detail').waitFor({ state: 'visible' });
  const detailSelector = '.prototype-detail__art';
  const detailFoilSelector = `${detailSelector} .prototype-card__foil`;
  const detailInitial = await computed(detailFoilSelector);
  const detailPointer = await moveTo(detailSelector, .73, .58);
  await page.mouse.move(1220, 160, { steps: 5 });
  await page.waitForTimeout(100);
  const detailRestored = await computed(detailFoilSelector);
  await page.keyboard.press('Escape');

  return {
    sr: { initial: srInitial, pointerOne: srFirstPointer, pointerTwo: srSecondPointer, afterLeave: srRestored },
    ur: { initial: urInitial, pointerOne: urFirstPointer, pointerTwo: urSecondPointer, afterLeave: urRestored },
    urDetail: { initial: detailInitial, pointer: detailPointer, afterLeave: detailRestored },
  };
}
