import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill } from "@remotion/renderer";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// 对标仿制·复刻验证件渲染:Distill-Waffle-31(华夫点阵图,motion.md 表3)
// 用法:node scripts/render-distill-waffle.mjs --stills   → 探针静帧 3 张(out/distill/waffle-stills/)
//       node scripts/render-distill-waffle.mjs --mp4     → 正式渲染(out/distill/waffle-replica.mp4)
// 注意(错题本 E-02):Remotion 4.0.515 renderMedia 只传 output 曾不落盘,
//      这里统一取返回 buffer 后 writeFileSync,并在结尾校验文件存在。

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const mode = process.argv.includes("--stills") ? "stills" : "mp4";
const outDir = path.resolve("out/distill");
mkdirSync(outDir, { recursive: true });

const composition = {
  id: "Distill-Waffle-31",
  durationInFrames: 105,
  fps: 30,
  width: 1280,
  height: 720,
};

console.log("Bundling...");
const bundleLocation = await bundle({ entryPoint: path.resolve("src/index.ts") });

if (mode === "stills") {
  // [帧, 标签] — 6=入场+充能初, 21=充能中段, 96=换数+紫点落定
  const checks = [
    [6, "probe-entry"],
    [21, "probe-filling"],
    [96, "probe-purple"],
  ];
  for (const [frame, name] of checks) {
    const out = path.join(outDir, `waffle-still-${name}.png`);
    console.log(`Rendering still ${name} @${frame}...`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      frame,
      output: out,
      imageFormat: "png",
      browserExecutable: CHROME,
    });
  }
  console.log("Done:", outDir);
} else {
  const out = path.join(outDir, "waffle-replica.mp4");
  console.log("Rendering mp4 (105 frames)...");
  const result = await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    browserExecutable: CHROME,
  });
  if (!result.buffer) throw new Error("renderMedia 未返回 buffer, refusing to claim success");
  writeFileSync(out, result.buffer);
  const { statSync } = await import("node:fs");
  const size = statSync(out).size;
  if (size < 10000) throw new Error(`产出异常(仅 ${size} 字节)`);
  console.log(`Done: ${out} (${(size / 1024 / 1024).toFixed(2)} MB)`);
}
