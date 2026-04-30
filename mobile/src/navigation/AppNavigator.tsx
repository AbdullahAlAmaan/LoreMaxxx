import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Map as MapIcon, Trophy, User as UserIcon } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import RouteScreen from '../screens/RouteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MapStack = createNativeStackNavigator();
const LeaderboardStack = createNativeStackNavigator();

// Dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FFFFFF',
    background: '#000000',
    card: '#111111',
    text: '#FFFFFF',
    border: '#222222',
    notification: '#FFFFFF',
  },
};

// Tab bar icon component
function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <View style={[tabIconStyles.container, focused && tabIconStyles.focused]}>
      <Icon color={focused ? '#FFFFFF' : '#8E99A4'} size={20} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

// Map tab with nested stack for route detail
function MapStackNavigator() {
  return (
    <MapStack.Navigator
      id={undefined}
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <MapStack.Screen
        name="MapMain"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <MapStack.Screen
        name="Route"
        component={RouteScreen}
        options={{ title: 'Route' }}
      />
    </MapStack.Navigator>
  );
}

// Leaderboard tab with nested stack for user profiles
function LeaderboardStackNavigator() {
  return (
    <LeaderboardStack.Navigator
      id={undefined}
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <LeaderboardStack.Screen
        name="LeaderboardMain"
        component={LeaderboardScreen}
        options={{ headerShown: false }}
      />
      <LeaderboardStack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{ title: 'User Profile' }}
      />
    </LeaderboardStack.Navigator>
  );
}

// Main tab navigator (authenticated)
function MainTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#222222',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 4,
          height: 88,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#5A5E6D',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Explore"
        component={MapStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon Icon={MapIcon} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Trophy} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon Icon={UserIcon} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Auth stack (unauthenticated)
function AuthStack() {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
