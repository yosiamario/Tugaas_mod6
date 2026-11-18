import { View } from "react-native";
import { WithSkiaWeb } from "react-native-skia/lib/module/web";

// Web needs CanvasKit (WASM) before any Skia component can mount, so the
// orb is loaded lazily there. Native keeps the direct implementation.
const SKIA_WEB_OPTS = {
  locateFile: (file) => `/${file}`,
};

export function TempOrb(props) {
  return (
    <WithSkiaWeb
      getComponent={() => import("./TempOrbWebInner.js")}
      componentProps={props}
      opts={SKIA_WEB_OPTS}
      fallback={<View style={{ width: props.size, height: props.size }} />}
    />
  );
}
