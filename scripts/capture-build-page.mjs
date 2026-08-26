export async function withLoadedBuildPage(context, buildServer, { label, pagePath, viewport, media }, usePage) {
  const page = await context.newPage();
  const loadingErrors = [];

  try {
    await page.setViewportSize(viewport);
    page.on('requestfailed', (request) => loadingErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        loadingErrors.push(`${response.request().method()} ${response.url()}: HTTP ${response.status()}`);
      }
    });

    const response = await page.goto(`${buildServer.origin}${pagePath}`, { waitUntil: 'networkidle' });

    if (!response?.ok()) {
      throw new Error(`${label} returned HTTP ${response?.status() ?? 'unknown'}.`);
    }

    if (media !== undefined) {
      await page.emulateMedia({ media });
    }

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    if (loadingErrors.length > 0) {
      throw new Error(`${label} did not load completely:\n${loadingErrors.join('\n')}`);
    }

    return await usePage(page);
  } finally {
    await page.close();
  }
}
