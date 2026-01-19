import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export type RememberOrbRef = {
  setMode: (mode: 0 | 1 | 2) => void;
  setAmplitude: (amp: number) => void;
};

const SPLINE_URL =
  "https://my.spline.design/rememberallrobot-9t094cDmngDJJB0Bdt8UsYWR/";

const injectedJS = `
(function () {
  let attempts = 0;

  const resizeAndScale = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return false;

    // Force full-screen canvas
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';

    // Mobile needs BIG scaling
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const scale = isMobile ? 2.4 : 1.4;

    canvas.style.transform = \`scale(\${scale})\`;
    canvas.style.transformOrigin = 'center center';

    // Prevent clipping
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    return true;
  };

  const interval = setInterval(() => {
    if (window.spline && resizeAndScale()) {
      clearInterval(interval);
    }
    if (++attempts > 120) clearInterval(interval);
  }, 100);

  window.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (window.spline) {
        if (typeof data.mode === "number") {
          window.spline.setVariable("mode", data.mode);
        }
        if (typeof data.amp === "number") {
          window.spline.setVariable("amp", data.amp);
        }
      }
    } catch (e) {}
  });
})();
true;
`;


const RememberOrb = forwardRef<RememberOrbRef>((_, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      webViewRef.current?.postMessage(JSON.stringify({ mode }));
    },
    setAmplitude(amp) {
      const clamped = Math.max(0, Math.min(1, amp));
      webViewRef.current?.postMessage(JSON.stringify({ amp: clamped }));
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.webviewWrapper}>
        <WebView
          cacheEnabled={false}
          ref={webViewRef}
          source={{ uri: SPLINE_URL }}
          injectedJavaScript={injectedJS}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          style={styles.webview}
        />
      </View>
    </View>
  );
});

export default RememberOrb;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    overflow: "hidden", // Crop overflow
  },
  webviewWrapper: {
    width: "100%",
    height: "125%", // Make it taller
    marginTop: "-5%", // Shift up to hide bottom watermark
    
  },
  webview: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});