# https://script.google.com/macros/s/AKfycbx4dRFVlecBY0RXMoaGFdvb5Hbl77FRv7bfDv1-00BD-5VYpgvjJckS4tkC5gSbPIf2/exec?type=youtube
// 📦 Vercel環境でブラウザを爆速で動かすための特殊ユニット
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // 隊員の指定したjsonリクエスト形式を想定して、クエリまたはボディから動画IDを取得
  const videoId = req.query.videoId || (req.body && req.body.videoId) || 'AyNILJgjIco';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // 1. Vercelのサーバーレス空間に、姿を隠したブラウザ（Chrome）を召喚！
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // 2. 人間っぽく見せるためのUser-Agent装填
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 3. YouTubeの迷宮へ突入、JSが完全に実行されるまでじっと待機！
    // networkidle2 を指定することで、裏での通信（URLの継ぎ足し）が落ち着くまで待つ
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // 4. 【核心】JSが実行され、ytInitialPlayerResponse や APIキーが完全に画面に展開された「最終結果のHTML」をキャプチャ！
    const executedHtml = await page.content();

    await browser.close();

    // 5. GASやスマホ側で処理しやすいように、記号やバックスラッシュを維持したまま、HTMLをJSONに包んで射出！
    res.status(200).json({
      success: true,
      videoId: videoId,
      html: executedHtml // これが「JS実行済み」の無敵のHTMLだ！
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
