import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import CreateTournamentScreen from '../screens/CreateTournamentScreen';
import JoinGameScreen from '../screens/JoinGameScreen';
import HostGameScreen from '../screens/HostGameScreen';
import TrainScreen from '../screens/TrainScreen';
import CoachDetailsScreen from '../screens/CoachDetailsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import SquadListScreen from '../screens/SquadListScreen';
import SquadDetailsScreen from '../screens/SquadDetailsScreen';
import CreateSquadScreen from '../screens/CreateSquadScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import StoreScreen from '../screens/StoreScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import SupportScreen from '../screens/SupportScreen';
import EventsScreen from '../screens/EventsScreen';
import RedemptionStoreScreen from '../screens/RedemptionStoreScreen';
import MembershipScreen from '../screens/MembershipScreen';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { RootStackParamList } from '../types';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { useResponsive } from '../hooks/useResponsive';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Home Stack Navigator (Nested to keep Tabs visible)
const HomeStack = createNativeStackNavigator<RootStackParamList>();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: colors.background.primary } }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Venues" component={VenuesScreen} />
      <HomeStack.Screen name="VenueDetails" component={VenueDetailsScreen} />
      <HomeStack.Screen name="SlotSelection" component={SlotSelectionScreen} />
      <HomeStack.Screen name="BookingDetails" component={BookingDetailsScreen} />

      <HomeStack.Screen name="Reviews" component={ReviewsScreen} />
      <HomeStack.Screen name="Store" component={StoreScreen} />
      <HomeStack.Screen name="Payments" component={PaymentsScreen} />
      <HomeStack.Screen name="Support" component={SupportScreen} />
      <HomeStack.Screen name="Events" component={EventsScreen} />
      <HomeStack.Screen name="RedemptionStore" component={RedemptionStoreScreen} />
      <HomeStack.Screen name="Membership" component={MembershipScreen} />
      <HomeStack.Screen name="ProfileOverview" component={ProfileOverviewScreen} />
    </HomeStack.Navigator>
  );
};

// Play Stack
const PlayStack = createNativeStackNavigator<RootStackParamList>();
const PlayStackNavigator = () => {
  return (
    <PlayStack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: colors.background.primary } }}>
      <PlayStack.Screen name="Play" component={PlayScreen} />
      <PlayStack.Screen name="CreateTournament" component={CreateTournamentScreen} />
      <PlayStack.Screen name="JoinGame" component={JoinGameScreen} />
      <PlayStack.Screen name="HostGame" component={HostGameScreen} />
    </PlayStack.Navigator>
  );
};

// Train Stack
const TrainStack = createNativeStackNavigator<RootStackParamList>();
const TrainStackNavigator = () => {
  return (
    <TrainStack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: colors.background.primary } }}>
      <TrainStack.Screen name="Train" component={TrainScreen} />
      <TrainStack.Screen name="CoachDetails" component={CoachDetailsScreen} />
      {/* Reuse Booking Flow */}
      <TrainStack.Screen name="SlotSelection" component={SlotSelectionScreen} />
      <TrainStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <TrainStack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
    </TrainStack.Navigator>
  );
};



// Community Stack
const CommunityStack = createNativeStackNavigator<RootStackParamList>();
const CommunityStackNavigator = () => {
  return (
    <CommunityStack.Navigator screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200, contentStyle: { backgroundColor: colors.background.primary } }}>
      <CommunityStack.Screen name="Community" component={CommunityScreen} />
      <CommunityStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <CommunityStack.Screen name="SquadList" component={SquadListScreen} />
      <CommunityStack.Screen name="SquadDetails" component={SquadDetailsScreen} />
      <CommunityStack.Screen name="CreateSquad" component={CreateSquadScreen} />
      <CommunityStack.Screen name="ChatList" component={ChatListScreen} />
      <CommunityStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </CommunityStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#333',
          paddingBottom: Math.max(insets.bottom, 5), // Use safe area bottom or minimum 5
          height: 60 + (insets.bottom > 0 ? insets.bottom - 5 : 0), // Adjust height dynamically
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PlayTab') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'BookTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'TrainTab') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'CommunityTab') {
            if (user?.avatarUrl) {
              return (
                <View style={{
                  width: size, height: size, borderRadius: size / 2,
                  overflow: 'hidden', borderWidth: focused ? 1 : 0, borderColor: color
                }}>
                  <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              );
            }
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="PlayTab" component={PlayStackNavigator} options={{ title: 'Play' }} />
      <Tab.Screen name="BookTab" component={MyBookingsScreen} options={{ title: 'Book' }} />
      {/* <Tab.Screen name="TrainTab" component={TrainStackNavigator} options={{ title: 'Train' }} /> */}
      {/* <Tab.Screen name="CommunityTab" component={CommunityStackNavigator} options={{ title: 'Community' }} /> */}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
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

  // Custom dark theme — replaces DefaultTheme which has a white background.
  // React Navigation uses this theme background as the backdrop during screen
  // transitions. Without this, transitions briefly flash white on Android.
  const AppTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000000',
      card: '#1C1C1E',
    },
  };

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 200,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="ProfileOverview"
              component={ProfileOverviewScreen}
              options={{
                animation: 'fade',
                animationDuration: 200,
              }}
            />
            <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
            <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
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
  container: {
    flex: 1,
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    bottom: moderateScale(100), // Adjusted to clear Bottom Tab Bar
    right: moderateScale(16),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: 28,
    backgroundColor: '#1C1C1E', // Dark Grey
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999,
  },
  fabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#39E079',
    marginTop: 2,
  },
});

export default AppNavigator;
