import "@primer/primitives/dist/css/functional/themes/light.css";
import { GoogleTagManager } from "@next/third-parties/google";

import { ThemeProvider, BaseStyles } from "@primer/react";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <BaseStyles>
        <Component {...pageProps} />
        <GoogleTagManager gtmId="GTM-5MVLKHZD" />
      </BaseStyles>
    </ThemeProvider>
  );
}
