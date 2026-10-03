import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { Sparkles, Calendar, BarChart3, User, Home } from 'lucide-react-native';
import { View, StyleSheet, Platform, type ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';

/**
 * Tab icon with a pill that springs in rather than swapping instantly, so moving
 * between sections reads as a transition instead of a redraw.
 */
const TabIcon = React.memo(function TabIcon({
  Icon,
  color,
  focused,
  gradient,
}: {
  Icon: React.ComponentType<any>;
  color: string;
  focused: boolean;
  gradient: readonly string[];
}) {
  const pill = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    pill.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 260, mass: 0.7 });
    if (focused) {
      pop.value = withTiming(1.12, { duration: 110, easing: Easing.out(Easing.quad) });
      pop.value = withSpring(1, { damping: 12, stiffness: 420 });
    }
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pill.value * 0.22,
    transform: [{ scale: 0.7 + 0.3 * pill.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <View style={styles.iconBox}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pill, pillStyle]}>
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={iconStyle}>
        <Icon color={color} size={20} />
      </Animated.View>
    </View>
  );
});

export default function TabsLayout() {
  const { theme } = useTheme();

  // expo-router hands the icon a ColorValue; the theme only ever supplies strings.
  const renderIcon = (Icon: React.ComponentType<any>) =>
    function Render({ color, focused }: { color: ColorValue; focused: boolean }) {
      return (
        <TabIcon
          Icon={Icon}
          color={color as string}
          focused={focused}
          gradient={theme.colors.primaryGradient}
        />
      );
    };

  const onTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1.2,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
          elevation: 16,
          shadowColor: theme.colors.background,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: renderIcon(Home) }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="generate"
        options={{ title: 'AI Studio', tabBarIcon: renderIcon(Sparkles) }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: renderIcon(Calendar) }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'Analytics', tabBarIcon: renderIcon(BarChart3) }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Studio', tabBarIcon: renderIcon(User) }}
        listeners={{ tabPress: onTabPress }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 38,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 10,
  },
});
