import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import {
  Atlas,
  Canvas,
  Circle,
  FilterMode,
  Group,
  MipmapMode,
  Skia,
  rect,
  useRSXformBuffer,
  usePictureAsTexture,
} from "react-native-skia";
import { useIsFocused } from "@react-navigation/native";
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { tokens } from "../theme/tokens.js";

const { color } = tokens;

// "Thermal gyroscope": four orbital rings of dots, each with its own tilt,
// direction and speed, orbiting a pulsing core. Replaces the dot globe.
const RINGS = 4;
const DOTS_PER_RING = 48;
const DOT_COUNT = RINGS * DOTS_PER_RING;
const TEX = 32;
// Clearance for the reading in the middle: an ellipse that matches the
// number + status word, so the rings fade out behind the text instead of
// leaving single stray dots at the sides.
const CLEAR_RX = 106;
const CLEAR_RY = 52;
const BASE_SPEED = 0.45;

const RING_RADIUS = [0.55, 0.72, 0.88, 1.0];
const RING_TILT = [0.18, 0.4, 0.62, 0.88];
const RING_DIR = [1, -1, 1, -1];
const RING_SPEED = [0.45, 0.62, 0.38, 0.55];

const RING_OF = new Array(DOT_COUNT);
const ANGLE_OFFSET = new Array(DOT_COUNT);
for (let i = 0; i < DOT_COUNT; i++) {
  const ring = Math.floor(i / DOTS_PER_RING);
  RING_OF[i] = ring;
  ANGLE_OFFSET[i] = ((i % DOTS_PER_RING) / DOTS_PER_RING) * Math.PI * 2;
}

// Plain-JS projection shared by the mount precompute (no runtime needed).
function projectAll(t, swell, R, cx, cy) {
  const out = new Array(DOT_COUNT);
  for (let i = 0; i < DOT_COUNT; i++) {
    const ring = RING_OF[i];
    const angle =
      ANGLE_OFFSET[i] + t * RING_DIR[ring] * RING_SPEED[ring] + ring * 0.7;
    const rr =
      RING_RADIUS[ring] * (1 + 0.05 * Math.sin(t * 1.2 + ring)) * R * swell;
    const x0 = Math.cos(angle) * rr;
    const z0 = Math.sin(angle) * rr;
    const tilt = RING_TILT[ring];
    const y1 = -z0 * Math.sin(tilt);
    const z1 = z0 * Math.cos(tilt);
    const nz = z1 / (R || 1);
    const depth = (nz + 1) / 2;
    const s = 2 / (2 - nz);
    const sx = cx + x0 * s;
    const sy = cy + y1 * s;
    const hx = sx - cx;
    const hy = sy - cy;
    const hidden =
      (hx * hx) / (CLEAR_RX * CLEAR_RX) + (hy * hy) / (CLEAR_RY * CLEAR_RY) < 1;
    const sc = 0.22 * (0.6 + 0.7 * depth) * swell;
    out[i] = hidden
      ? [0, 0, -10000, -10000]
      : [sc, 0, sx - (TEX / 2) * sc, sy - (TEX / 2) * sc];
  }
  return out;
}

export function TempOrb({
  tint = color.text,
  beatKey = 0,
  size = 200,
  dimmed = false,
}) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const angle = useSharedValue(0.6);
  const spinBoost = useSharedValue(0);
  const intensity = useSharedValue(0);
  const dimSV = useSharedValue(dimmed ? 1 : 0);
  const firstBeat = useRef(true);

  const R = (size * 0.94) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // The dot texture is baked in the status tint. Baking it (instead of
  // modulating a white atlas with per-sprite colors) keeps the colour correct
  // on web, where atlas colours are not converted to CanvasKit floats.
  const dotPicture = useMemo(() => {
    try {
      const recorder = Skia.PictureRecorder();
      const canvas = recorder.beginRecording(rect(0, 0, TEX, TEX));
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setColor(Skia.Color(tint));
      canvas.drawCircle(TEX / 2, TEX / 2, TEX / 2 - 1, paint);
      return recorder.finishRecordingAsPicture();
    } catch {
      return null;
    }
  }, [tint]);
  const dotImg = usePictureAsTexture(dotPicture, { width: TEX, height: TEX });

  const sprites = useMemo(
    () => new Array(DOT_COUNT).fill(0).map(() => rect(0, 0, TEX, TEX)),
    []
  );

  const transforms = useRSXformBuffer(DOT_COUNT, (val, i) => {
    "worklet";
    const ring = RING_OF[i];
    const a =
      ANGLE_OFFSET[i] + angle.value * RING_DIR[ring] * RING_SPEED[ring] + ring * 0.7;
    const swell = 1 + 0.05 * intensity.value;
    const rr =
      RING_RADIUS[ring] * (1 + 0.05 * Math.sin(angle.value * 1.2 + ring)) * R * swell;
    const x0 = Math.cos(a) * rr;
    const z0 = Math.sin(a) * rr;
    const tilt = RING_TILT[ring];
    const y1 = -z0 * Math.sin(tilt);
    const z1 = z0 * Math.cos(tilt);
    const nz = z1 / (R || 1);
    const depth = (nz + 1) / 2;
    const s = 2 / (2 - nz);
    const sx = cx + x0 * s;
    const sy = cy + y1 * s;
    const hx = sx - cx;
    const hy = sy - cy;
    if (
      (hx * hx) / (CLEAR_RX * CLEAR_RX) + (hy * hy) / (CLEAR_RY * CLEAR_RY) <
      1
    ) {
      val.set(0, 0, -10000, -10000);
      return;
    }
    const sc = 0.22 * (0.6 + 0.7 * depth) * swell;
    val.set(sc, 0, sx - (TEX / 2) * sc, sy - (TEX / 2) * sc);
  });

  // First-frame insurance: correct rings even before the first mapper pass.
  useEffect(() => {
    try {
      const initial = projectAll(0.6, 1, R, cx, cy);
      transforms.value = transforms.value.map((slot, i) => {
        slot.set(initial[i][0], initial[i][1], initial[i][2], initial[i][3]);
        return slot;
      });
    } catch {
      // buffer write unsupported — mapper pass will fill it instead
    }
  }, [transforms, R, cx, cy]);

  useEffect(() => {
    dimSV.set(withTiming(dimmed ? 1 : 0, { duration: 400 }));
  }, [dimmed, dimSV]);

  useEffect(() => {
    if (firstBeat.current) {
      firstBeat.current = false;
      return;
    }
    if (!beatKey || dimmed || reduceMotion) return;
    intensity.set(0);
    intensity.set(
      withSequence(
        withTiming(1, { duration: 160 }),
        withTiming(0.4, { duration: 190 }),
        withTiming(0.75, { duration: 130 }),
        withTiming(0, { duration: 320 })
      )
    );
    spinBoost.set(2.2);
    try {
      // Expo Go on Android can reject this promise; swallow it so the beat
      // still plays without an unhandled rejection.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // haptics unsupported — visual beat still plays
    }
  }, [beatKey, dimmed, reduceMotion, intensity, spinBoost]);

  const frame = useFrameCallback((info) => {
    "worklet";
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    spinBoost.value *= Math.pow(0.02, dt);
    angle.value += dt * (BASE_SPEED + spinBoost.value);
  });

  useEffect(() => {
    frame.setActive(focused && !reduceMotion && !dimmed);
  }, [focused, reduceMotion, dimmed, frame]);

  const groupOpacity = useDerivedValue(() => 0.85 * (1 - 0.55 * dimSV.value));
  // A thin "lens" ring around the reading instead of a solid core, so the
  // number stays legible while the ring still pulses on each new reading.
  const lensRadius = useDerivedValue(() => size * 0.19 * (1 + 0.06 * intensity.value));
  const lensOpacity = useDerivedValue(
    () => (0.2 + 0.55 * intensity.value) * (1 - 0.5 * dimSV.value)
  );

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Canvas style={{ width: size, height: size }}>
        <Group opacity={groupOpacity}>
          <Circle
            cx={cx}
            cy={cy}
            r={lensRadius}
            color={tint}
            opacity={lensOpacity}
            style="stroke"
            strokeWidth={1.5}
          />
          <Atlas
            image={dotImg}
            sprites={sprites}
            transforms={transforms}
            sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.Linear }}
          />
        </Group>
      </Canvas>
    </View>
  );
}
