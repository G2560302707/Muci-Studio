import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// 页面级防溢出:任何场景内容横向溢出视口时,Chrome 会渲染滚动条
// (暗色配色下是一条 ~53px 黑条,正好出现在画面右缘,导致成片"靠左偏")。
// 全局隐藏滚动条 + 锁死背景色,根治 ep05-preview-v4 发现的黑条问题。
const style = document.createElement("style");
style.textContent = `
  html, body {
    overflow: hidden !important;
    background: #ffffff;
  }
  ::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
`;
document.head.appendChild(style);

registerRoot(RemotionRoot);
