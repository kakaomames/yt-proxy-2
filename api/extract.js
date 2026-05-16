let GASUrl = "https://script.google.com/macros/s/*/exec?"
// 🚨 [最優先] システムのライブラリ不足を騙すため、自分たちのフォルダを探索パスの最前線に配置！
const path = require('path');
const libPath = path.join(process.cwd(), 'api', 'lib');
process.env.LD_LIBRARY_PATH = `${libPath}:${process.env.LD_LIBRARY_PATH || ''}`;

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const videoId = req.query.videoId || 'AyNILJgjIco';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let browser = null;

  try {
    // 🛡️ ポータブルライブラリを読み込ませつつChromiumを召喚
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gl-drawing-for-tests',
        '--single-process'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 🚀 YouTubeのJS実行待機
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 25000 
    });

    const executedHtml = await page.content();

    res.status(200).json({
      success: true,
      videoId: videoId,
      html: executedHtml
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Vercel Pure Proxy Crash: ${error.message}`,
      stack: error.stack
    });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
