let GASUrl = "https://script.google.com/macros/s/*/exec?"
// 🎯 Vercel側はただの中継基地にするため、重たいPuppeteerはすべて撤去！
const axios = require('axios'); // ※ package.json に "axios" を追加するぞ！

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

  // 🛰️ クラウドの最強JS実行プロキシ「Scrape.do」の無料エンドポイントをハック！
  // 登録不要でテストできるデモトークン、または自分の無料トークンを入れる枠
  const token = "YOUR_SCRAPEDO_TOKEN"; 
  
  // もしトークンがまだなければ、ただの超高速プロキシ「ProxyCrawl」などの無料エンドポイントでも可
  // 今回は「Scrape.do」のJSレンダリングモード（&render=true）を起動させる通信を編成！
  const proxyUrl = `https://api.scrape.do?token=6f7902d3856b4ab9bc62e0ca589e4ec3ff1c874e&url=${encodeURIComponent(targetUrl)}&render=true`;

  try {
    // 1. クラウド側のブラウザファームに、YouTubeのJS実行を丸投げしてHTMLを強奪する！
    const response = await axios.get(proxyUrl);
    const executedHtml = response.data;

    res.status(200).json({
      success: true,
      videoId: videoId,
      html: executedHtml // これが、OSのエラーをすり抜けて取ってきた本物のJS実行済みHTMLだ！
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Cloud Proxy Failed: ${error.message}`
    });
  }
};
