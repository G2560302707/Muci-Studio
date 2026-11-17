import { delayRender, continueRender, staticFile } from "remotion";
import { useEffect, useState } from "react";

const fontFaces = [
  { family: "MiSans Semibold", file: "fonts/MiSans-Semibold.otf", weight: "600" },
  { family: "MiSans Heavy", file: "fonts/MiSans-Heavy.otf", weight: "900" },
];

export const useMiSansFonts = () => {
  const [handle] = useState(() => delayRender("loading MiSans fonts"));

  useEffect(() => {
    const fonts = fontFaces.map(({ family, file, weight }) => {
      const font = new FontFace(family, `url(${staticFile(file)})`, {
        weight,
      });
      document.fonts.add(font);
      return font.load();
    });

    Promise.all(fonts)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};
