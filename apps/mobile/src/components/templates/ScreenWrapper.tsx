import React, { memo, useState, useEffect } from 'react';
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  ViewStyle,
  View,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { AmbientBackdrop } from '@/components/atoms/AmbientBackdrop';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  withTopInset?: boolean;
  withBottomInset?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = memo(({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  withTopInset = true,
  withBottomInset = true,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [keyboardSpace, setKeyboardSpace] = useState(0);

  /**
   * Every screen mounts with the same short rise-and-fade. Doing it here rather
   * than per screen means the 21 screens that had no entrance animation at all
   * get one for free, and the ones that stagger their own sections still work —
   * their inner timings run inside this outer fade.
   */
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, []);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 14 }],
  }));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardSpace(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardSpace(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const containerPadding: ViewStyle = {
    paddingTop: withTopInset ? insets.top : 0,
    paddingBottom: withBottomInset && keyboardSpace === 0 ? insets.bottom : 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, containerPadding, style]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Drifting palette wash — replaces the single static glow every screen shared */}
      <AmbientBackdrop
        glowColor={theme.colors.glowColor}
        secondaryColor={theme.colors.secondaryGradient[0]}
        isDark={theme.isDark}
      />

{scrollable ? (
        <Animated.View style={[styles.contentLayer, enterStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            contentContainerStyle={[
              styles.scrollContent,
              contentContainerStyle,
              {
                paddingBottom: keyboardSpace > 0 ? keyboardSpace + 24 : insets.bottom + 24,
              },
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.nonScrollContent, enterStyle]}>
          {children}
        </Animated.View>
      )}
    </View>
  );
});

ScreenWrapper.displayName = 'ScreenWrapper';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentLayer: {
    flex: 1,
  },
  nonScrollContent: {
    flex: 1,
  },
});
