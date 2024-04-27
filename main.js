import { chromium } from 'playwright';  // Chromium, Firefox, WebKit のいずれかを選択
import fs from 'fs';
import csv from 'csv-parser';
import util from 'util';
import stream from 'stream';

const pipeline = util.promisify(stream.pipeline);

async function takeScreenshot(browser, url, outputDir) {
  console.log("指定URLにアクセス:", url);
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(url);
    
    // ページを最下部まで自動スクロールする
    // await scrollPageToBottom(page);

    let scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const sanitizedUrl = url
      .replace(/https?:\/\//, "")
      .replace(/\//g, "__")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+$/, ""); // "http://" または "https://" を削除、スラッシュは__へ置換
    let filename = sanitizedUrl + "_0.png";
    // console.log("scrollHeight:", scrollHeight);
    if (1) {
      await page.screenshot({
        path: `${outputDir}/${filename}`,
        fullPage: true,
      });
      console.log("スクリーンショットが保存されました:", filename);
    }
  } catch (error) {
    console.error(`URL ${url} でエラーが発生しました:`, error);
  } finally {
    await page.close();
  }

}


async function takeScreenshots(csvFilePath, outputDir) {
  const browser = await chromium.launch();

  try {
    const urls = [];

    // CSVファイルからURLを読み込み
    await pipeline(
      fs.createReadStream(csvFilePath),
      csv(),
      new stream.Writable({
        objectMode: true,
        write(row, _, callback) {
          urls.push(row["URL"]);
          callback();
        },
      })
    );

    // URLごとにスクリーンショットを取る
    for (let url of urls) {
      // URLが定義されている場合実施(undefinedを除外)
      if (url !== undefined) {
        await takeScreenshot(browser, url, outputDir);
      }
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await browser.close();
  }
}

const csvFilePath = "./urls.csv";
const outputDir = "./dist";
takeScreenshots(csvFilePath, outputDir).catch((error) => {
  console.error("エラー詳細:", error.message);
});
