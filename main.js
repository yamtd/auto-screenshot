import { chromium } from "playwright";
import fs from "fs";
import csv from "csv-parser";
import util from "util";
import stream from "stream";

const pipeline = util.promisify(stream.pipeline);
const VIEWPORT_WIDTH = 375;
const VIEWPORT_HEIGHT = 667;

async function takeScreenshot(browser, url, outputDir) {
  console.log("指定URLにアクセス:", url);
  const page = await browser.newPage();

  try {
    await page.setViewportSize({
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    });
    await page.goto(url);

    const sanitizedUrl = url
      .replace(/https?:\/\//, "") // "http://" または "https://" を削除
      .replace(/\//g, "__") // スラッシュ "/" を "__" へ置換
      .replace(/[^a-zA-Z0-9_]/g, "_") // 特殊文字を "_" へ置換
      .replace(/_+$/, ""); // 末尾の "_" を削除
    let filename = sanitizedUrl + "_w" + VIEWPORT_WIDTH + ".png";

    // ページを最下部まで自動スクロールする
    await autoScroll(page);
    // 最上部に戻す
    await page.evaluate(() => window.scrollTo(0, 0));
    // スクリーンショットを取得
    await page.screenshot({
      path: `${outputDir}/${filename}`,
      fullPage: true,
    });
    console.log("スクリーンショットが保存されました:", filename);
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

async function autoScroll(page) {
  const viewportHeight = VIEWPORT_HEIGHT;  // Node.js 環境から値を取得
  await page.evaluate(async (viewportHeight) => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = viewportHeight * 0.5;  // 修正: 外部から渡された viewportHeight を使用
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }, viewportHeight);  // 外部から viewportHeight を渡す
}

const csvFilePath = "./urls.csv";
const outputDir = "./dist";
takeScreenshots(csvFilePath, outputDir).catch((error) => {
  console.error("エラー詳細:", error.message);
});
