import React from "react";
import { Composition } from "remotion";
import { previewScenes } from "./components/previews";
import { ThemeProvider, getTheme } from "./style/ThemeContext";
import type { ThemeName } from "./style/themes";
import { EpisodeDemo, DEMO_TOTAL_FRAMES } from "./demo/Episode";
import { demoConfig } from "./demo/loadConfig";

const withTheme =
  (themeName: ThemeName, Scene: React.FC): React.FC =>
  () => (
    <ThemeProvider value={getTheme(themeName)}>
      <Scene />
    </ThemeProvider>
  );

export const RemotionRoot = () => {
  const theme = (demoConfig.meta.theme as ThemeName) || "whiteWindow";

  return (
    <>
      {previewScenes.map((scene) => (
        <Composition
          key={scene.name}
          id={`Preview-${scene.name}`}
          component={scene.component}
          durationInFrames={scene.durationInFrames}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
      {previewScenes.map((scene) => (
        <Composition
          key={`landscape-${scene.name}`}
          id={`Preview-${scene.name}-Landscape`}
          component={scene.component}
          durationInFrames={scene.durationInFrames}
          fps={30}
          width={1920}
          height={1080}
        />
      ))}
      {previewScenes.map((scene) => (
        <Composition
          key={`blackgold-${scene.name}`}
          id={`Preview-${scene.name}-BlackGold`}
          component={withTheme("blackGold", scene.component)}
          durationInFrames={scene.durationInFrames}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
      {previewScenes.map((scene) => (
        <Composition
          key={`blackgold-landscape-${scene.name}`}
          id={`Preview-${scene.name}-BlackGold-Landscape`}
          component={withTheme("blackGold", scene.component)}
          durationInFrames={scene.durationInFrames}
          fps={30}
          width={1920}
          height={1080}
        />
      ))}

      <Composition
        id="Episode-Demo"
        component={withTheme(theme, EpisodeDemo)}
        durationInFrames={DEMO_TOTAL_FRAMES}
        fps={demoConfig.meta.fps || 30}
        width={demoConfig.meta.width || 1920}
        height={demoConfig.meta.height || 1080}
      />
    </>
  );
};
