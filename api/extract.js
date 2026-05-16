let GASUrl = "https://script.google.com/macros/s/*/exec?"
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // CORS防御壁をあらかじめ解放
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
    // 🛡️ Vercelのインフラ内で headless Chrome を絶対に暴走させずに起動する設定
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gl-drawing-for-tests',
        '--single-process' // 👈 これがVercelのコンテナ制限を突破する超重要フラグ！
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // 人間になりすます偽装データ
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 🚀 YouTubeへ突撃！JSの実行と裏のURL継ぎ足し（networkidle2）をじっと待つ
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 25000 
    });

    // JavaScript実行完了後の、完全体HTMLを強奪！！
    const executedHtml = await page.content();

    res.status(200).json({
      success: true,
      videoId: videoId,
      html: executedHtml
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Vercel Browser Crash: ${error.message}`,
      stack: error.stack
    });
  } finally {
    // ゾンビプロセス化してVercelのメモリを食い潰さないように確実に閉じる
    if (browser !== null) {
      await browser.close();
    }
  }
};
