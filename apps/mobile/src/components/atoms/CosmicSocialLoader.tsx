import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Instagram, Linkedin, Twitter, Facebook, Video, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The orbit numbers below are mirrored in
 * apps/admin/src/components/ui/CosmicSocialSplash.tsx — change one, change the
 * other, or the splash stops reading as the same loader on web and app.
 */
const PERSPECTIVE = 700; // camera focal length, px
const STAGE = 400; // orrery container, px
const CENTER = STAGE / 2;
const CLOCK_SPAN_MS = 120000;

const SCREEN = Dimensions.get('window');
/**
 * The orrery is authored at 400pt (the web geometry) and fitted to the device.
 * Height is capped too — on a short viewport a width-only fit lets the orbits
 * run off the top of the screen.
 */
const FIT = Math.min(1, (SCREEN.width - 44) / STAGE, (SCREEN.height * 0.58) / STAGE);
const CONTAINER_SIZE = STAGE * FIT;

interface OrbitSpec {
  id: string;
  radiusX: number;
  radiusY: number;
  /** deg — how far the orbit plane tips out of the sky plane */
  inclination: number;
  /** deg — where that tipped plane points inside the sky plane */
  node: number;
  /** deg — starting position on the orbit */
  phase: number;
  /** seconds per revolution */
  period: number;
  direction: 1 | -1;
  colors: [string, string, string];
  glow: string;
  size: number;
  iconSize: number;
  iconColor: string;
}

const ORBITS: OrbitSpec[] = [
  {
    id: 'instagram',
    radiusX: 112, radiusY: 112, inclination: 66, node: -14, phase: 0,
    period: 13, direction: 1,
    colors: ['#E1306C', '#F56040', '#FCAF45'], glow: '#E1306C',
    size: 34, iconSize: 16, iconColor: '#FFFFFF',
  },
  {
    id: 'twitter',
    radiusX: 134, radiusY: 134, inclination: 52, node: 54, phase: 72,
    period: 16.5, direction: -1,
    colors: ['#00F0FF', '#1DA1F2', '#0A84FF'], glow: '#00F0FF',
    size: 32, iconSize: 15, iconColor: '#07080B',
  },
  {
    id: 'linkedin',
    radiusX: 98, radiusY: 98, inclination: 74, node: 116, phase: 144,
    period: 11.5, direction: 1,
    colors: ['#0A66C2', '#0077B5', '#38BDF8'], glow: '#0A66C2',
    size: 31, iconSize: 15, iconColor: '#FFFFFF',
  },
  {
    id: 'tiktok',
    radiusX: 148, radiusY: 132, inclination: 44, node: -62, phase: 216,
    period: 18, direction: -1,
    colors: ['#FF0050', '#00F2FE', '#FF385C'], glow: '#FF0050',
    size: 35, iconSize: 15, iconColor: '#FFFFFF',
  },
  {
    id: 'facebook',
    radiusX: 120, radiusY: 120, inclination: 60, node: 154, phase: 288,
    period: 15, direction: 1,
    colors: ['#1877F2', '#3B5998', '#4F46E5'], glow: '#1877F2',
    size: 30, iconSize: 15, iconColor: '#FFFFFF',
  },
];

const PLANET_ICONS = [Instagram, Twitter, Linkedin, Video, Facebook];

/** Half-depth of an orbit — normalises the front/back brightness cue. */
function orbitDepth(o: OrbitSpec): number {
  'worklet';
  return o.radiusY * Math.sin((o.inclination * Math.PI) / 180);
}

/**
 * Project one point of an orbit plane to screen space.
 *
 * A planet sits on a circle inside its own plane; that plane is tipped about the
 * X axis by `inclination` (which is what creates real depth) and then swung about
 * the view axis by `node`. Two orbits with the same inclination but a different
 * `node` are therefore revolutions about genuinely different axes.
 */
function project(o: OrbitSpec, thetaDeg: number) {
  'worklet';
  const t = (thetaDeg * Math.PI) / 180;
  const inc = (o.inclination * Math.PI) / 180;
  const node = (o.node * Math.PI) / 180;

  const inPlaneX = Math.cos(t) * o.radiusX;
  const inPlaneY = Math.sin(t) * o.radiusY;

  const tippedY = inPlaneY * Math.cos(inc);
  const z = inPlaneY * Math.sin(inc);

  const x = inPlaneX * Math.cos(node) - tippedY * Math.sin(node);
  const y = inPlaneX * Math.sin(node) + tippedY * Math.cos(node);

  // Near things (z > 0) are thrown outward and enlarged by the camera.
  const k = PERSPECTIVE / (PERSPECTIVE - z);
  return { x: x * k, y: y * k, scale: k, z };
}

/** A trail is the same projection, swept once around the plane. */
function trailPath(o: OrbitSpec): string {
  const steps = 96;
  const parts: string[] = [];
  for (let s = 0; s <= steps; s++) {
    const p = project(o, (s / steps) * 360);
    parts.push(
      `${s === 0 ? 'M' : 'L'}${((CENTER + p.x) * FIT).toFixed(2)} ${((CENTER + p.y) * FIT).toFixed(2)}`
    );
  }
  return `${parts.join(' ')} Z`;
}

const OrbitingPlanet = React.memo(function OrbitingPlanet({
  index,
  clock,
  layer,
}: {
  index: number;
  clock: { value: number };
  layer: number;
}) {
  // Fallback config keeps the hook unconditional (rules of hooks); the render
  // guard below still returns null for out-of-range indices.
  const cfg = ORBITS[index] ?? ORBITS[0]!;
  const IconComponent = PLANET_ICONS[index];

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const elapsed = clock.value / 1000;
    const p = project(cfg, cfg.phase + cfg.direction * (elapsed / cfg.period) * 360);
    const near = (p.z / orbitDepth(cfg) + 1) / 2; // 0 = far side, 1 = near side

    return {
      transform: [
        { translateX: p.x * FIT },
        { translateY: p.y * FIT },
        { scale: p.scale },
      ],
      opacity: 0.5 + 0.5 * near,
    };
  });

  if (!IconComponent) return null;

  return (
    <Animated.View
      style={[
        styles.planetContainer,
        {
          width: cfg.size,
          height: cfg.size,
          left: CONTAINER_SIZE / 2 - cfg.size / 2,
          top: CONTAINER_SIZE / 2 - cfg.size / 2,
          zIndex: layer,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.planetGlow,
          {
            shadowColor: cfg.glow,
            width: cfg.size,
            height: cfg.size,
            borderRadius: cfg.size / 2,
          },
        ]}
      >
        <View style={[styles.planetSphere, { borderRadius: cfg.size / 2, overflow: 'hidden' }]}>
          <LinearGradient
            colors={cfg.colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.planetHighlight} />
          <IconComponent size={cfg.iconSize} color={cfg.iconColor} />
        </View>
      </View>
    </Animated.View>
  );
});

const StarDust = React.memo(function StarDust({
  top,
  left,
  size,
  duration,
}: {
  top: number;
  left: number;
  size: number;
  duration: number;
}) {
  const pulse = useSharedValue(0.2);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.9, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const starStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.starDust,
        { top, left, width: size, height: size, borderRadius: size / 2 },
        starStyle,
      ]}
    />
  );
});

export const CosmicSocialLoader: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const clock = useSharedValue(0);
  const corePulse = useSharedValue(1);
  const ringRotation = useSharedValue(0);
  const trailFade = useSharedValue(0);

  useEffect(() => {
    clock.value = withTiming(CLOCK_SPAN_MS, {
      duration: CLOCK_SPAN_MS,
      easing: Easing.linear,
    });
    corePulse.value = withRepeat(
      withSequence(
        withTiming(1.075, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 26000, easing: Easing.linear }),
      -1,
      false
    );
    trailFade.value = withTiming(0.3, { duration: 900, easing: Easing.out(Easing.ease) });
  }, []);

  /**
   * Depth sorting. Reanimated cannot animate `zIndex` on the UI thread, so the
   * front/back decision is sampled at 10Hz — half a degree of orbital travel
   * between samples, which is far below what the eye resolves, and it keeps the
   * orbiting itself off the JS thread.
   */
  const [layers, setLayers] = useState<number[]>(() => ORBITS.map(() => 12));

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = clock.value / 1000;
      const next = ORBITS.map((o) => {
        const p = project(o, o.phase + o.direction * (elapsed / o.period) * 360);
        return p.z >= 0 ? 30 : 12;
      });
      setLayers((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    }, 100);
    return () => clearInterval(id);
  }, []);

  const trails = useMemo(() => ORBITS.map(trailPath), []);

  const animatedCore = useAnimatedStyle(() => ({
    transform: [{ scale: corePulse.value }],
  }));

  const animatedRing = useAnimatedStyle(() => ({
    transform: [{ rotateX: '72deg' }, { rotateZ: `${ringRotation.value}deg` }],
  }));

  const animatedTrails = useAnimatedStyle(() => ({ opacity: trailFade.value }));

  return (
    <View style={[styles.container, { width: CONTAINER_SIZE, height: CONTAINER_SIZE }]}>
      <StarDust top={20} left={40} size={2.5} duration={1700} />
      <StarDust top={50} left={CONTAINER_SIZE - 60} size={2} duration={2100} />
      <StarDust top={CONTAINER_SIZE - 70} left={30} size={3} duration={2500} />
      <StarDust top={140} left={10} size={2} duration={2800} />
      <StarDust top={CONTAINER_SIZE - 110} left={CONTAINER_SIZE / 2} size={2} duration={2600} />

      {/* Orbit planes, projected exactly as the planets travel them */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedTrails]} pointerEvents="none">
        <Svg width={CONTAINER_SIZE} height={CONTAINER_SIZE}>
          {ORBITS.map((o, idx) => (
            <Path
              key={o.id}
              d={trails[idx]}
              stroke={o.glow}
              strokeWidth={1}
              strokeDasharray="4 7"
              fill="none"
            />
          ))}
        </Svg>
      </Animated.View>

      {/* 5 orbiting social planets */}
      {ORBITS.map((o, idx) => (
        <OrbitingPlanet key={o.id} index={idx} clock={clock} layer={layers[idx] ?? 12} />
      ))}

      {/* Central brand mark */}
      <View style={styles.coreWrapper}>
        {/*
          A plain View cannot fade to transparent, so the halo is an SVG radial
          gradient — a solid disc at low opacity just reads as a muddy blob.
        */}
        <Svg width={190} height={190} style={styles.coreHaloSvg} pointerEvents="none">
          <Defs>
            <RadialGradient id="core-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={theme.colors.glowColor} stopOpacity={isDark ? 0.4 : 0.26} />
              <Stop offset="55%" stopColor={theme.colors.glowColor} stopOpacity={isDark ? 0.14 : 0.09} />
              <Stop offset="100%" stopColor={theme.colors.glowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={95} cy={95} r={95} fill="url(#core-halo)" />
        </Svg>

        <Animated.View style={[styles.saturnRing, animatedRing]} />
        <Animated.View
          style={[
            styles.coreSphere,
            {
              shadowColor: theme.colors.glowColor,
              borderColor: theme.colors.cardGlassBorder,
            },
            animatedCore,
          ]}
        >
          <LinearGradient
            colors={theme.colors.primaryGradient as [string, string, ...string[]]}
            start={{ x: 0.15, y: 0.1 }}
            end={{ x: 0.85, y: 0.9 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 31 }]}
          />
          <View style={styles.coreSpecular} />
          <Sparkles size={22} color={theme.colors.btnTextColor} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coreWrapper: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 22,
  },
  coreHaloSvg: {
    position: 'absolute',
    width: 190,
    height: 190,
  },
  saturnRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  coreSphere: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS coloured glow halo only. No Android `elevation`: on the animating orbit
    // subtree it forced per-frame re-rasterisation on low-end devices.
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
  },
  coreSpecular: {
    position: 'absolute',
    top: 8,
    left: 13,
    width: 16,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transform: [{ rotate: '-22deg' }],
  },
  planetContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetGlow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  planetSphere: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  planetHighlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ rotate: '-20deg' }],
  },
  starDust: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});
