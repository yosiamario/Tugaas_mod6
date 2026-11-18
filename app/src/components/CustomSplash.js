import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { tokens } from "../theme/tokens.js";

const { color } = tokens;

const BACKDROP = color.bg;
const ACCENT = color.primary;

// Launch splash that borrows the app's own palette so the hand-off to the
// first screen feels seamless: native splash (same colour) → this overlay →
// app. The composition is deliberately full-bleed: soft rings radiate past
// the screen edges, the mark sits large in the middle, and the whole scene
// breathes once while the app settles.
export function CustomSplash({ onFinish }) {
  const reduceMotion = useReducedMotion();
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const overlayOpacity = useSharedValue(1);
  const markOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const markScale = useSharedValue(reduceMotion ? 1 : 0.94);
  const textOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const textShift = useSharedValue(reduceMotion ? 0 : 10);
  const breath = useSharedValue(1);
  const ripple = useSharedValue(1);
  const haloScale = useSharedValue(0.85);
  const haloOpacity = useSharedValue(0);

  useEffect(() => {
    const handleDone = () => {
      onFinishRef.current?.();
    };

    const intro = reduceMotion ? 180 : 380;
    const hold = reduceMotion ? 500 : 1350;

    markOpacity.value = withTiming(1, { duration: intro });
    markScale.value = reduceMotion
      ? withTiming(1, { duration: intro })
      : withSpring(1, { damping: 17, stiffness: 120, mass: 0.9 });
    textOpacity.value = withDelay(intro * 0.45, withTiming(1, { duration: intro }));
    textShift.value = withDelay(
      intro * 0.45,
      withTiming(0, { duration: intro, easing: Easing.out(Easing.cubic) })
    );

    if (!reduceMotion) {
      // gentle breathing of the mark + a slow expansion of the outer rings
      breath.value = withDelay(
        intro,
        withRepeat(
          withTiming(1.035, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
      );
      ripple.value = withDelay(
        intro,
        withRepeat(
          withTiming(1.06, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
      );
      haloOpacity.value = withRepeat(
        withTiming(0.3, { duration: 800, easing: Easing.out(Easing.quad) }),
        1,
        false
      );
      haloScale.value = withRepeat(
        withTiming(1.7, { duration: 1700, easing: Easing.out(Easing.cubic) }),
        1,
        false
      );
    }

    overlayOpacity.value = withDelay(
      hold + intro,
      withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(handleDone)();
        }
      })
    );

    return () => {
      cancelAnimation(breath);
      cancelAnimation(ripple);
      cancelAnimation(haloScale);
      cancelAnimation(haloOpacity);
    };
    // shared values are stable refs — the intro should run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value * breath.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ripple.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textShift.value }],
  }));

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      pointerEvents="auto"
      accessibilityLabel="LiveTemp is starting"
      accessibilityRole="progressbar"
    >
      {/* full-screen rings, radiating from the mark */}
      <View style={styles.center}>
        <View style={styles.markStage}>
          <Animated.View style={[styles.ripples, rippleStyle]} pointerEvents="none">
            <View style={[styles.ripple, styles.rippleOuter]} />
            <View style={[styles.ripple, styles.rippleMid]} />
            <View style={[styles.ripple, styles.rippleInner]} />
          </Animated.View>

          <Animated.View style={[styles.halo, haloStyle]} />
          <Animated.View style={[styles.mark, markStyle]}>
            <View style={styles.ringOuter} />
            <View style={styles.ringInner} />
            <View style={styles.core} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.title}>LiveTemp</Text>
          <Text style={styles.subtitle}>Real-time temperature monitoring</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 50,
  },
  // rings are centred on the mark and intentionally larger than the screen,
  // so the composition reaches the edges instead of floating in empty space
  ripples: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    borderColor: "rgba(37,99,235,0.10)",
    borderWidth: 1,
    borderRadius: 9999,
  },
  rippleOuter: {
    width: 760,
    height: 760,
    borderColor: "rgba(37,99,235,0.05)",
  },
  rippleMid: {
    width: 560,
    height: 560,
    borderColor: "rgba(37,99,235,0.08)",
  },
  rippleInner: {
    width: 400,
    height: 400,
    borderColor: "rgba(37,99,235,0.12)",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 34,
    paddingHorizontal: 24,
  },
  markStage: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    borderColor: "rgba(37,99,235,0.30)",
  },
  mark: {
    width: 196,
    height: 196,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.16)",
  },
  ringInner: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: "rgba(37,99,235,0.34)",
  },
  core: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: color.text,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: color.text2,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
