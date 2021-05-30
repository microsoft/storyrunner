import { join } from 'path';
import * as playwright from 'playwright';
import exposePlaywright from './playwrightMethods';
import { StoryWrightOptions } from './StoryWrightOptions'

export class StoryWrightProcessor {
  public static async process(options: StoryWrightOptions) {
    try {
      const browser = await playwright.chromium.launch({ headless: options.headless, slowMo: 50 });
      const context = await browser.newContext();
      await context.setDefaultTimeout(90 * 1000);
      const page = await context.newPage();
      await page.goto(join(options.url, 'iframe.html'));
      const stories: object[] = await page.evaluate(
        '(__STORYBOOK_CLIENT_API__?.raw() || []).map(e => ({id: e.id, kind: e.kind, name: e.name}))'
      );
      await page.close();
      console.log(`${stories.length} stories found`);
      let screenshotIndex = 0;
      const batchSize = 1;
      let position = 0;
      while (position < stories.length) {
        const itemsForBatch = stories.slice(position, position + batchSize);
        await Promise.all(
          itemsForBatch.map(async (story: object, index: number) => {
            const id: string = story['id'];
            const ssNamePrefix = `${story['kind']}#${story['name']}`;
            const logPrefix = `story:${index + 1}/${stories.length}`;
            if (
              id.includes('header') &&
              !id.includes('headerribbontoggle') &&
              !id.includes('sharedheaderplaceholder')
              //  || id.includes('documenttitle')
            ) {
              //console.log(`header encountered. Returning: ${id}`);
              return;
            }
            try {
              console.log('async');
              const page = await context.newPage();
              page.setViewportSize({
                width: 1920,
                height: 964,
              });
              await exposePlaywright(page, options.screenShotDestPath, ssNamePrefix);
              
              console.log('Rendering story: ');
              await page.goto(join(options.url, `iframe.html?id=${id}`));
              console.log(`${Date.now()}  ${new Date().toUTCString()}:: Page closed 1 == ${await page.isClosed()}`);
              screenshotIndex++;
              console.log(`${logPrefix} screenshot:${screenshotIndex}/${stories.length}  ${id}`);
              await page.waitForEvent('close');
              
              //await page.close();
              console.log(`${Date.now()} ${new Date().toUTCString()}:: Page closed 2 == ${await page.isClosed()}`);
            } catch (err) {
              console.log(`${logPrefix} **ERROR** ${err}`);
            }
          })
        );
        position += batchSize;
      }
    }
    catch (err) {
      console.log(`** ERROR ** ${err}`);
    }
    finally {
      console.log('Closing midgard-stories process');
    }
  }
}