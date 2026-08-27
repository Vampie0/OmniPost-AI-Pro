import React, { memo, useState, useEffect } from 'react';
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  ViewStyle,
  Dimensions,
  View,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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

      {/* Top Ambient Glow */}
      <LinearGradient
        colors={[
          theme.isDark ? `${theme.colors.glowColor}22` : `${theme.colors.glowColor}12`,
          'transparent',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topRadialGlow}
        pointerEvents="none"
      />

      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: keyboardSpace > 0 ? keyboardSpace + 24 : insets.bottom + 24,
            },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.nonScrollContent}>{children}</View>
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
  nonScrollContent: {
    flex: 1,
  },
  topRadialGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
  },
});
