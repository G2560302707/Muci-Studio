import { bundle } from "@remotion/bundler";
import { renderStill } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const modules = [
  "Hook",
  "Problem",
  "Hallucination",
  "Method",
  "Compare",
  "Checklist",
  "Closing",
];

const outputDir = path.resolve("out/storyboards/context-explainer");
mkdirSync(outputDir, { recursive: true });

console.log("Bundling...");
const bundleLocation = await bundle({
  entryPoint: path.resolve("src/storyboards/context-root.tsx"),
});

for (const name of modules) {
  const compositionId = `Context-${name}`;
  console.log(`Rendering ${compositionId}...`);
  await renderStill({
    composition: {
      id: compositionId,
      durationInFrames: 130,
      fps: 30,
      width: 1080,
      height: 1920,
    },
    serveUrl: bundleLocation,
    frame: 0,
    output: path.join(outputDir, `${name}-first.png`),
    imageFormat: "png",
    browserExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
}

for (const name of modules) {
  const compositionId = `Context-${name}`;
  console.log(`Rendering ${compositionId} last frame...`);
  await renderStill({
    composition: {
      id: compositionId,
      durationInFrames: 130,
      fps: 30,
      width: 1080,
      height: 1920,
    },
    serveUrl: bundleLocation,
    frame: 129,
    output: path.join(outputDir, `${name}-last.png`),
    imageFormat: "png",
    browserExecutable: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
}
