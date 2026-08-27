import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { Sparkles, Calendar, BarChart3, User, Home } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabsLayout() {
  const { theme } = useTheme();

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
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && { backgroundColor: theme.colors.badgeBg }]}>
              <Home color={color} size={20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'AI Studio',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && { backgroundColor: theme.colors.badgeBg }]}>
              <Sparkles color={color} size={20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && { backgroundColor: theme.colors.badgeBg }]}>
              <Calendar color={color} size={20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && { backgroundColor: theme.colors.badgeBg }]}>
              <BarChart3 color={color} size={20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && { backgroundColor: theme.colors.badgeBg }]}>
              <User color={color} size={20} />
            </View>
          ),
        }}
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
});
