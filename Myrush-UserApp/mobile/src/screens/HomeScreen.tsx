import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	TouchableOpacity,
	ImageBackground,
	Dimensions,
	Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { reviewsApi } from '../api/venues';
import ReviewReminderModal from '../components/ReviewReminderModal';

const { width } = Dimensions.get('window');

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
	const { user, logout } = useAuthStore();
	const navigation = useNavigation<Navigation>();
	const [searchQuery, setSearchQuery] = useState('');

	// Review reminder modal state
	const [showReviewReminder, setShowReviewReminder] = useState(false);
	const [currentReminderBooking, setCurrentReminderBooking] = useState<any>(null);
	const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

	const displayName = user?.fullName?.split(' ')[0] || user?.firstName || 'Alex';

	// Check for unreviewed completed bookings on screen load
	useEffect(() => {
		const checkForReviewReminders = async () => {
			try {
				const result = await reviewsApi.getUnreviewedCompletedBookings();

				if (result.success && result.data && result.data.length > 0) {
					// Find the first booking that hasn't been dismissed
					const bookingToRemind = result.data.find((booking: any) =>
						!dismissedReminders.has(booking.id)
					);

					if (bookingToRemind) {
						setCurrentReminderBooking(bookingToRemind);
						setShowReviewReminder(true);
					}
				}
			} catch (error) {
				console.error('Error checking for review reminders:', error);
			}
		};

		// Only check if user is logged in
		if (user) {
			checkForReviewReminders();
		}
	}, [user, dismissedReminders]);

	// Handle giving rating - navigate to review screen
	const handleGiveRating = (booking: any) => {
		setShowReviewReminder(false);
		// Navigate to MyBookings screen - since it's a tab, navigate to MainTabs first
		navigation.navigate('MainTabs');
		// Note: Could enhance this to automatically switch to the Bookings tab
	};

	// Handle skipping the reminder
	const handleSkipReminder = () => {
		if (currentReminderBooking) {
			setDismissedReminders(prev => new Set([...prev, currentReminderBooking.id]));
		}
		setShowReviewReminder(false);
		setCurrentReminderBooking(null);
	};

	// Handle closing the modal
	const handleCloseReminder = () => {
		setShowReviewReminder(false);
		setCurrentReminderBooking(null);
	};

	const quickActions = [
		{ icon: 'play-circle-outline', label: 'Book Court', color: colors.primary },
		{ icon: 'card-outline', label: 'Payments', color: colors.primary },
		{ icon: 'chatbubble-outline', label: 'Support', color: colors.primary },
		{ icon: 'barbell-outline', label: 'Training', color: colors.primary },
		{ icon: 'trophy-outline', label: 'Tournaments', color: colors.primary },
	];

	const topRatedPlayers = [
		{ name: 'John S', rating: 4.9 },
		{ name: 'Sarah M', rating: 4.8 },
	];

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<View style={styles.locationContainer}>
							<Ionicons name="location-sharp" size={moderateScale(16)} color="#fff" />
							<Text style={styles.locationText}>Mumbai</Text>
						</View>
						<View style={styles.greetingContainer}>
							<Text style={styles.greeting}>Welcome, {displayName}! </Text>
							<Text style={styles.greetingEmoji}>👋</Text>
						</View>
						<Text style={styles.subGreeting}>Ready to play?</Text>
					</View>

					<TouchableOpacity style={styles.notificationButton}>
						<Ionicons name="notifications" size={moderateScale(20)} color="#fff" />
					</TouchableOpacity>
				</View>

				{/* Search Bar */}
				<View style={styles.searchContainer}>
					<Ionicons name="search" size={moderateScale(20)} color="#fff" style={styles.searchIcon} />
					<TextInput
						style={styles.searchInput}
						placeholder="Search for games..."
						placeholderTextColor="#666"
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>

				{/* Game On Section (Featured) */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Game On</Text>
				</View>

				<TouchableOpacity
					style={styles.featuredCard}
					onPress={() => navigation.navigate('Venues')}
					activeOpacity={0.9}
				>
					<ImageBackground
						source={require('../../assets/fieldbooking.png')}
						style={styles.featuredImage}
						imageStyle={styles.featuredImageStyle}
					>
						<LinearGradient
							colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
							style={styles.featuredOverlay}
						>
							<View style={styles.liveBadge}>
								<View style={styles.liveDot} />
								<Text style={styles.liveText}>LIVE</Text>
							</View>

							<View style={styles.matchInfo}>
								<Text style={styles.matchLeague}>PREMIER LEAGUE</Text>
								<Text style={styles.matchTeams}>Man City vs Arsenal</Text>
							</View>
						</LinearGradient>
					</ImageBackground>
				</TouchableOpacity>

				{/* Nearby Venues */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Nearby Venues</Text>
					<TouchableOpacity onPress={() => navigation.navigate('Venues')}>
						<Text style={styles.seeAllText}>View All</Text>
					</TouchableOpacity>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.venuesList}
				>
					<TouchableOpacity
						style={styles.venueItem}
						onPress={() => navigation.navigate('Venues')}
					>
						<Image
							source={require('../../assets/dashboard-hero.png')}
							style={styles.venueItemImage}
						/>
						<View style={styles.venueItemInfo}>
							<Text style={styles.venueItemName}>Central Arena</Text>
							<Text style={styles.venueItemMeta}>Football • 2km</Text>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.venueItem}
						onPress={() => navigation.navigate('Venues')}
					>
						<View style={[styles.venueItemImage, { backgroundColor: '#333' }]} />
						<View style={styles.venueItemInfo}>
							<Text style={styles.venueItemName}>Urban Turf</Text>
							<Text style={styles.venueItemMeta}>Cricket • 5km</Text>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.venueItem}
						onPress={() => navigation.navigate('Venues')}
					>
						<Image
							source={require('../../assets/login-image.png')}
							style={styles.venueItemImage}
						/>
						<View style={styles.venueItemInfo}>
							<Text style={styles.venueItemName}>Sport Plaza</Text>
							<Text style={styles.venueItemMeta}>Badminton • 3km</Text>
						</View>
					</TouchableOpacity>
				</ScrollView>

				{/* Placeholder for Bottom Padding */}
				<View style={{ height: hp(12) }} />
			</ScrollView>

			{/* Floating AI Action Button */}
			<TouchableOpacity style={styles.fabButton}>
				<Ionicons name="flash" size={moderateScale(24)} color="#fff" />
				<Text style={styles.fabText}>AI</Text>
			</TouchableOpacity>

			{/* Review Reminder Modal */}
			<ReviewReminderModal
				visible={showReviewReminder}
				booking={currentReminderBooking}
				onGiveRating={() => { }}
				onSkip={handleSkipReminder}
				onClose={handleCloseReminder}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000', // True Black
	},
	scrollContent: {
		paddingTop: hp(8),
		paddingBottom: hp(5),
	},
	header: {
		paddingHorizontal: wp(6),
		marginBottom: hp(3),
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: hp(0.5),
	},
	locationText: {
		color: '#9CA3AF',
		marginLeft: wp(1),
		fontSize: fontScale(12),
		fontFamily: 'Lexend-Medium',
		marginTop: 2, // Alignment adjustment
	},
	greetingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	greeting: {
		fontSize: fontScale(24),
		fontFamily: 'Lexend-Bold',
		color: '#fff',
	},
	greetingEmoji: {
		fontSize: fontScale(20),
	},
	subGreeting: {
		fontSize: fontScale(14),
		color: '#9CA3AF',
		fontFamily: 'Lexend-Regular',
		marginTop: 2,
	},
	notificationButton: {
		width: wp(10),
		height: wp(10),
		borderRadius: wp(5),
		backgroundColor: '#1C1C1E',
		justifyContent: 'center',
		alignItems: 'center',
	},
	searchContainer: {
		marginHorizontal: wp(6),
		marginBottom: hp(4),
		height: 52,
		backgroundColor: '#1A1A1A',
		borderRadius: 26, // Fully rounded
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: wp(5),
		borderWidth: 1,
		borderColor: 'rgba(57, 224, 121, 0.3)', // Subtle green border
	},
	searchIcon: {
		marginRight: wp(3),
	},
	searchInput: {
		flex: 1,
		color: '#fff',
		fontFamily: 'Lexend-Regular',
		fontSize: fontScale(14),
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: wp(6),
		marginBottom: hp(2),
	},
	sectionTitle: {
		fontSize: fontScale(18),
		fontFamily: 'Lexend-Bold',
		color: '#fff',
	},
	seeAllText: {
		color: colors.primary, // #39E079
		fontSize: fontScale(12),
		fontFamily: 'Lexend-Bold',
	},
	featuredCard: {
		marginHorizontal: wp(6),
		height: hp(22),
		marginBottom: hp(4),
		borderRadius: 24,
		overflow: 'hidden',
	},
	featuredImage: {
		width: '100%',
		height: '100%',
	},
	featuredImageStyle: {
		borderRadius: 24,
	},
	featuredOverlay: {
		flex: 1,
		justifyContent: 'space-between',
		padding: wp(5),
	},
	liveBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FF453A',
		paddingHorizontal: wp(3),
		paddingVertical: hp(0.5),
		borderRadius: 12,
		alignSelf: 'flex-start',
	},
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#fff',
		marginRight: wp(1.5),
	},
	liveText: {
		color: '#fff',
		fontSize: fontScale(10),
		fontFamily: 'Lexend-Bold',
		letterSpacing: 1,
	},
	matchInfo: {},
	matchLeague: {
		color: colors.primary,
		fontSize: fontScale(12),
		fontFamily: 'Lexend-Bold',
		marginBottom: 2,
		letterSpacing: 0.5,
	},
	matchTeams: {
		color: '#fff',
		fontSize: fontScale(18),
		fontFamily: 'Lexend-Bold',
	},
	venuesList: {
		paddingHorizontal: wp(6),
	},
	venueItem: {
		width: wp(40),
		marginRight: wp(4),
	},
	venueItemImage: {
		width: '100%',
		height: hp(12),
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
	},
	venueItemInfo: {
		backgroundColor: '#1A1A1A', // Darker surface
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
		padding: wp(3),
	},
	venueItemName: {
		color: '#fff',
		fontSize: fontScale(14),
		fontFamily: 'Lexend-Bold',
		marginBottom: 2,
	},
	venueItemMeta: {
		color: '#9CA3AF',
		fontSize: fontScale(12),
		fontFamily: 'Lexend-Regular',
	},
	fabButton: {
		position: 'absolute',
		bottom: hp(12), // Above tab bar
		right: wp(6),
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#1A1A1A', // Dark surface
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	fabText: {
		color: colors.primary,
		fontSize: fontScale(10),
		fontFamily: 'Lexend-Bold',
		marginTop: -2,
	},
});

export default HomeScreen;
