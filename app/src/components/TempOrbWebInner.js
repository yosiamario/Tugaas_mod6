import { TempOrb as TempOrbCanvas } from "./TempOrb.js";

// Default export wrapper so WithSkiaWeb's dynamic import can mount the real
// Skia implementation once CanvasKit has finished loading.
export default function TempOrbWeb(props) {
  return <TempOrbCanvas {...props} />;
}
