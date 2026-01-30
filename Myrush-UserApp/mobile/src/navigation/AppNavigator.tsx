import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import OTPLoginScreen from '../screens/OTPLoginScreen';
import PlayerProfileScreen from '../screens/PlayerProfileScreen';
import ProfileOverviewScreen from '../screens/ProfileOverviewScreen';
import VenuesScreen from '../screens/VenuesScreen';
import PlayScreen from '../screens/PlayScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import VenueDetailsScreen from '../screens/VenueDetailsScreen';
import SlotSelectionScreen from '../screens/SlotSelectionScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import ReviewBookingScreen from '../screens/ReviewBookingScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import CreateTournamentScreen from '../screens/CreateTournamentScreen';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { useResponsive } from '../hooks/useResponsive';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator Component
const MainTabNavigator = () => {
  const { rs, isSmall, isLarge } = useResponsive();

  // Responsive tab bar height based on device size
  const tabBarHeight = rs(70, 75, 80, 85); // small, medium, large, tablet
  const tabBarPaddingBottom = rs(8, 10, 12, 15);
  const tabBarPaddingTop = rs(6, 8, 10, 12);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Play') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Bookings') {
            iconName = 'calendar';
          } else if (route.name === 'Train') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={moderateScale(size)} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.dark,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: tabBarPaddingTop,
          paddingHorizontal: wp(2.5),
        },
        tabBarLabelStyle: {
          fontSize: fontScale(rs(10, 11, 12, 13)), // responsive font size
          fontWeight: '500',
          marginTop: hp(-0.8),
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Play"
        component={PlayScreen}
        options={{ tabBarLabel: 'Play' }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIconStyle: {
            marginTop: hp(-2.5),
          },
          tabBarLabelStyle: {
            fontSize: fontScale(rs(11, 12, 13, 14)), // responsive font size
            fontWeight: '600',
            marginTop: hp(-0.8),
            color: colors.primary,
            position: 'absolute',
            bottom: rs(3, 5, 6, 8), // responsive bottom position
          },
          tabBarIcon: ({ focused }) => {
            const iconSize = rs(55, 65, 70, 75); // responsive icon size
            const iconDimension = rs(50, 60, 65, 70); // responsive width/height
            const iconBorderRadius = iconDimension / 2;
            const iconMarginBottom = rs(20, 25, 28, 32);

            return (
              <View
                style={{
                  width: iconDimension,
                  height: iconDimension,
                  borderRadius: iconBorderRadius,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: iconMarginBottom,
                  elevation: 10,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Ionicons name="calendar" size={moderateScale(iconSize * 0.43)} color="#fff" />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Train"
        component={HomeScreen}
        options={{ tabBarLabel: 'Train' }}
      />
      <Tab.Screen
        name="Community"
        component={PlayerProfileScreen}
        options={{ tabBarLabel: 'Community' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ProfileOverview" component={ProfileOverviewScreen} />
            <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} />
            <Stack.Screen name="Venues" component={VenuesScreen} />
            <Stack.Screen name="VenueDetails" component={VenueDetailsScreen} />
            <Stack.Screen name="SlotSelection" component={SlotSelectionScreen} />
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} />
            <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />
            <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default AppNavigator;
