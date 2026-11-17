// 预览渲染离线字体 stub:不走 gstatic,避免国内 CDN 超时拖垮 delayRender。
// 样片字体与线上不完全一致,但保证「渲染」按钮可用。
const FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';

export function loadFont(_style, options = {}) {
  if (typeof options?.onComplete === 'function') {
    try {
      options.onComplete();
    } catch {
      // ignore
    }
  }
  return {
    fontFamily: FAMILY,
    waitUntilDone: () => Promise.resolve(),
    getInfo: () => ({
      fontFamily: FAMILY,
      importName: 'OfflineStub',
      version: '0',
      url: '',
      unicodeRanges: {},
      fonts: {},
    }),
  };
}

export default { loadFont };
