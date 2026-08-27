import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Instagram, Linkedin, Twitter, Sparkles, Video, Share2 } from 'lucide-react-native';

const CONTAINER_SIZE = 280;

interface PlanetProps {
  angleOffset: number;
  rotation: Animated.SharedValue<number>;
  radiusX: number;
  radiusY: number;
  colors: readonly [string, string, ...string[]];
  icon: React.ReactNode;
  glow: string;
  size?: number;
}

const CelestialOrbitPlanet: React.FC<PlanetProps> = ({
  angleOffset,
  rotation,
  radiusX,
  radiusY,
  colors,
  icon,
  glow,
  size = 30,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const totalAngle = ((rotation.value + angleOffset) * Math.PI) / 180;
    const x = Math.cos(totalAngle) * radiusX;
    const y = Math.sin(totalAngle) * radiusY;

    // 3D Depth scaling
    const scale = 0.85 + 0.25 * Math.sin(totalAngle);
    const opacity = 0.8 + 0.2 * Math.sin(totalAngle);

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.planetContainer,
        {
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.planetGlow, { shadowColor: glow, width: size, height: size, borderRadius: size / 2 }]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.planetSphere, { borderRadius: size / 2 }]}
        >
          {/* Subtle reflection highlight */}
          <View style={styles.planetHighlight} />
          {icon}
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// Ambient Star Dust
const StarDust: React.FC<{ top: number; left: number; size: number; duration: number }> = ({
  top,
  left,
  size,
  duration,
}) => {
  const pulse = useSharedValue(0.2);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.9, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const starStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: pulse.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.starDust,
        {
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        starStyle,
      ]}
    />
  );
};

export const CosmicSocialLoader: React.FC = () => {
  const orbitRotation = useSharedValue(0);
  const corePulse = useSharedValue(1);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    orbitRotation.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );

    corePulse.value = withRepeat(
      withTiming(1.14, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    ringRotation.value = withRepeat(
      withTiming(360, { duration: 7500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedSun = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: corePulse.value }],
    };
  });

  const animatedSaturnRing = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotateX: '75deg' }, { rotateZ: `${ringRotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      {/* 1. Ambient Cosmic Star Dust */}
      <StarDust top={25} left={45} size={2.5} duration={1400} />
      <StarDust top={55} left={235} size={2} duration={1800} />
      <StarDust top={220} left={35} size={3} duration={2200} />
      <StarDust top={235} left={225} size={2} duration={1600} />
      <StarDust top={145} left={15} size={2} duration={2500} />
      <StarDust top={125} left={265} size={2.5} duration={1900} />

      {/* 2. Multiple 3D Tilted Dashed Orbit Rings */}
      <View style={[styles.orbitRing, styles.ring1]} pointerEvents="none" />
      <View style={[styles.orbitRing, styles.ring2]} pointerEvents="none" />
      <View style={[styles.orbitRing, styles.ring3]} pointerEvents="none" />

      {/* 3. Central Luminous Celestial Planet Core with Saturn Ring */}
      <View style={styles.centerPlanetWrapper}>
        <Animated.View style={[styles.saturnRing, animatedSaturnRing]} />

        <Animated.View style={[styles.coreSphere, animatedSun]}>
          <LinearGradient
            colors={['#FFFFFF', '#E2E8F0', '#94A3B8']}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
            style={styles.coreGradient}
          >
            <View style={styles.coreSpecular} />
            <Sparkles size={16} color="#07080B" />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* 4. Real Social Media Orbiting Celestial Planets */}
      {/* Instagram Planet */}
      <CelestialOrbitPlanet
        angleOffset={0}
        rotation={orbitRotation}
        radiusX={105}
        radiusY={52}
        colors={['#E1306C', '#F56040', '#FCAF45']}
        icon={<Instagram size={15} color="#FFFFFF" />}
        glow="#E1306C"
        size={30}
      />

      {/* Twitter / X Planet */}
      <CelestialOrbitPlanet
        angleOffset={90}
        rotation={orbitRotation}
        radiusX={105}
        radiusY={52}
        colors={['#00F0FF', '#1DA1F2', '#0A84FF']}
        icon={<Twitter size={14} color="#07080B" />}
        glow="#00F0FF"
        size={28}
      />

      {/* LinkedIn Planet */}
      <CelestialOrbitPlanet
        angleOffset={180}
        rotation={orbitRotation}
        radiusX={105}
        radiusY={52}
        colors={['#0A66C2', '#0077B5', '#38BDF8']}
        icon={<Linkedin size={14} color="#FFFFFF" />}
        glow="#0A66C2"
        size={28}
      />

      {/* TikTok / Video Planet */}
      <CelestialOrbitPlanet
        angleOffset={270}
        rotation={orbitRotation}
        radiusX={105}
        radiusY={52}
        colors={['#FF0050', '#00F2FE', '#FF385C']}
        icon={<Video size={14} color="#FFFFFF" />}
        glow="#FF0050"
        size={30}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderStyle: 'dashed',
  },
  ring1: {
    width: 215,
    height: 105,
    transform: [{ rotateX: '75deg' }],
  },
  ring2: {
    width: 225,
    height: 110,
    transform: [{ rotateX: '65deg' }, { rotateZ: '35deg' }],
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ring3: {
    width: 235,
    height: 115,
    transform: [{ rotateX: '60deg' }, { rotateZ: '-45deg' }],
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  centerPlanetWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 30,
  },
  saturnRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  coreSphere: {
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  coreGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coreSpecular: {
    position: 'absolute',
    top: 3,
    left: 6,
    width: 9,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
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
    elevation: 8,
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
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
