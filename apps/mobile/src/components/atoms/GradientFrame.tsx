import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientFrameProps {
  active: boolean;
  /** Palette gradient stops, e.g. `theme.colors.primaryGradient`. */
  gradient: readonly string[];
  /** Ring colour while inactive — usually `theme.colors.border`. */
  idleRingColor: string;
  /** Surface fill inside the ring. */
  innerColor: string;
  radius: number;
  ringWidth?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * A true gradient border.
 *
 * React Native cannot paint a gradient onto `borderColor`, so this draws a
 * gradient shell and insets an opaque panel over it, leaving the gradient
 * visible only as a ring. Both states reserve the same geometry — the ring is
 * always `ringWidth` thick, it is just painted with a flat colour when inactive
 * — so toggling selection never nudges the layout.
 */
export const GradientFrame: React.FC<GradientFrameProps> = ({
  active,
  gradient,
  idleRingColor,
  innerColor,
  radius,
  ringWidth = 2,
  style,
  innerStyle,
  children,
}) => (
  <View
    style={[
      { borderRadius: radius, backgroundColor: active ? undefined : idleRingColor },
      styles.shell,
      { padding: ringWidth },
      style,
    ]}
  >
    {active ? (
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    ) : null}
    <View
      style={[
        {
          borderRadius: Math.max(radius - ringWidth, 0),
          backgroundColor: innerColor,
        },
        styles.panel,
        innerStyle,
      ]}
    >
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: { overflow: 'hidden' },
  panel: { flex: 1, overflow: 'hidden' },
});
