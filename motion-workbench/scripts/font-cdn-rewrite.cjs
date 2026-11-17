// webpack loader:把 @remotion/google-fonts 内嵌的 fonts.gstatic.com 地址改写到可达镜像。
// 直连 gstatic 在国内不可达,而渲染时 Chromium 按 URL 拉取字体会整体超时。
// 可用 PREVIEW_FONT_CDN 环境变量覆盖镜像,代理可用时设回 https://fonts.gstatic.com 即可。
const FONT_BASE = process.env.PREVIEW_FONT_CDN || 'https://gstatic.loli.net';

module.exports = function (content) {
  if (typeof content !== 'string') return content;
  return content.split('https://fonts.gstatic.com').join(FONT_BASE);
};
