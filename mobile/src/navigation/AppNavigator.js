import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import {
  SplashScreen,
  LoginScreen,
  RegisterScreen,
  VerifyOtpScreen,
  ForgotPasswordScreen,
  OnboardingScreen,
  HomeScreen,
  TravelDetailsScreen,
  VehicleSelectScreen,
  BusRouteScreen,
  RouteComparisonScreen,
  RecommendedRouteScreen,
  RouteDetailsScreen,
  LiveJourneyScreen,
  EmergencyAssistanceScreen,
  ShareTripScreen,
  ProfileScreen,
  JourneyHistoryScreen,
  AIAssistantScreen,
  EmergencyServicesScreen
} from '../screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ label, icon, focused }) => (
  <View style={styles.tabItem}>
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon label="Home" icon="🏠" focused={focused} />
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={JourneyHistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon label="History" icon="🛣️" focused={focused} />
        }}
      />
      <Tab.Screen
        name="EmergencyTab"
        component={EmergencyServicesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon label="SOS" icon="🚨" focused={focused} />
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon label="Profile" icon="👤" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background }
        }}
      >
        {!isAuthenticated ? (
          // Unauthenticated Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          // Authenticated Protected Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="TravelDetails" component={TravelDetailsScreen} />
            <Stack.Screen name="VehicleSelect" component={VehicleSelectScreen} />
            <Stack.Screen name="BusRoute" component={BusRouteScreen} />
            <Stack.Screen name="RouteComparison" component={RouteComparisonScreen} />
            <Stack.Screen name="RecommendedRoute" component={RecommendedRouteScreen} />
            <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
            <Stack.Screen name="LiveJourney" component={LiveJourneyScreen} />
            <Stack.Screen name="EmergencyAssistance" component={EmergencyAssistanceScreen} />
            <Stack.Screen name="ShareTrip" component={ShareTripScreen} />
            <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
            <Stack.Screen name="EmergencyServices" component={EmergencyServicesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surfaceCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6
  },
  tabItem: {
    alignItems: 'center',
    justify.content: 'center'
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5
  },
  tabIconActive: {
    opacity: 1
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  tabLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '700'
  }
});
