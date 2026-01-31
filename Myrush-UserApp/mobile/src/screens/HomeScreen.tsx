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
					<View style={styles.headerLeft}>
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
						</View>
						<View>
							<Text style={styles.greeting}>Hello</Text>
							<Text style={styles.userName}>{displayName}</Text>
						</View>
					</View>
					<View style={styles.headerRight}>
						<TouchableOpacity
							style={styles.profileButton}
							onPress={() => navigation.navigate('ProfileOverview')}
						>
							<Ionicons name="person-outline" size={moderateScale(24)} color="#333" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.notificationButton}>
							<Ionicons name="notifications-outline" size={moderateScale(24)} color="#333" />
						</TouchableOpacity>
					</View>
				</View>

				{/* Search Bar */}
				<View style={styles.searchContainer}>
					<View style={styles.searchBar}>
						<Ionicons name="search-outline" size={moderateScale(20)} color="#999" />
						<TextInput
							style={styles.searchInput}
							placeholder="Search"
							placeholderTextColor="#999"
							value={searchQuery}
							onChangeText={setSearchQuery}
						/>
					</View>
					<TouchableOpacity style={styles.menuButton}>
						<Ionicons name="menu" size={moderateScale(24)} color="#fff" />
					</TouchableOpacity>
				</View>

				{/* Category Pills */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoryContainer}
				>
					{['Sports', 'Game', 'Squad', 'Field', 'Badminton'].map((category, index) => (
						<TouchableOpacity
							key={category}
							style={[styles.categoryPill, index === 0 && styles.categoryPillActive]}
						>
							<Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>
								{category}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{/* Field Booking Card */}
				<TouchableOpacity
					style={styles.heroCard}
					onPress={() => navigation.navigate('Venues')}
					activeOpacity={0.9}
				>
					<ImageBackground
						source={require('../../assets/fieldbooking.png')}
						style={styles.heroGradient}
						imageStyle={styles.heroImageBackground}
					>
						<View style={styles.heroOverlay}>
							<View style={styles.heroContent}>
								<Text style={styles.heroTitle}>Field Booking</Text>
								<Text style={styles.heroSubtitle}>
									Let an AI tell you why {'\n'}you should use MyRush.
								</Text>
								<TouchableOpacity style={styles.heroButton}>
									<Text style={styles.heroButtonText}>Learn more</Text>
									<Ionicons name="arrow-forward" size={moderateScale(16)} color="#fff" />
								</TouchableOpacity>
							</View>
							<View style={styles.heroImageContainer}>
								<View style={styles.mockChart}>
									{[...Array(8)].map((_, i) => (
										<View
											key={i}
											style={[
												styles.chartBar,
												{ height: Math.random() * 40 + 20 },
											]}
										/>
									))}
								</View>
							</View>
						</View>
					</ImageBackground>
				</TouchableOpacity>

				{/* Trending Events */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Trending Events</Text>
				</View>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.eventsContainer}
				>
					<View style={[styles.eventCard, { backgroundColor: '#4A1E5C' }]}>
						<View style={styles.eventCardContent}>
							<Text style={styles.eventTitle}>Badminton Facility</Text>
							<TouchableOpacity
								style={styles.eventBookButton}
								onPress={() => navigation.navigate('Venues')}
							>
								<Text style={styles.eventBookText}>Book</Text>
							</TouchableOpacity>
						</View>
						<LinearGradient
							colors={['transparent', colors.primary]}
							style={styles.eventGradient}
						/>
					</View>
					<View style={[styles.eventCard, { backgroundColor: '#1A3A3A' }]}>
						<View style={styles.eventCardContent}>
							<Text style={styles.eventTitle}>Basketball Sport</Text>
							<TouchableOpacity
								style={styles.eventBookButton}
								onPress={() => navigation.navigate('Venues')}
							>
								<Text style={styles.eventBookText}>Book</Text>
							</TouchableOpacity>
						</View>
						<LinearGradient
							colors={['transparent', colors.primary]}
							style={styles.eventGradient}
						/>
					</View>
				</ScrollView>

				{/* Our Services */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Our Services</Text>
				</View>
				<View style={styles.servicesGrid}>
					{quickActions.map((action, index) => (
						<TouchableOpacity
							key={index}
							style={styles.serviceItem}
							onPress={() => {
								// Field Booking card handles navigation, not this service
							}}
						>
							<LinearGradient
								colors={[action.color, `${action.color}AA`]}
								style={styles.serviceIcon}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
							>
								<Ionicons name={action.icon as any} size={moderateScale(24)} color="#fff" />
							</LinearGradient>
							<Text style={styles.serviceLabel}>{action.label}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Top Recommended */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Top Recommended</Text>
					<TouchableOpacity>
						<Text style={styles.seeAll}>See all</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.recommendedList}>
					<View style={styles.recommendedItem}>
						<View style={styles.recommendedIcon}>
							<Ionicons name="tennisball" size={moderateScale(20)} color={colors.primary} />
						</View>
						<View style={styles.recommendedContent}>
							<Text style={styles.recommendedTitle}>MyRush AI Referee</Text>
							<Text style={styles.recommendedMeta}>42 Minutes</Text>
						</View>
						<View style={styles.recommendedBadge}>
							<Ionicons name="star" size={moderateScale(16)} color="#FFB800" />
						</View>
					</View>
					<View style={styles.recommendedItem}>
						<View style={styles.recommendedIcon}>
							<Ionicons name="trophy" size={moderateScale(20)} color={colors.primary} />
						</View>
						<View style={styles.recommendedContent}>
							<Text style={styles.recommendedTitle}>Badminton</Text>
							<Text style={styles.recommendedMeta}>15 Facilities</Text>
						</View>
						<View style={styles.recommendedBadge}>
							<Ionicons name="star" size={moderateScale(16)} color="#FFB800" />
						</View>
					</View>
					<View style={styles.recommendedItem}>
						<View style={styles.recommendedIcon}>
							<Ionicons name="basketball" size={moderateScale(20)} color={colors.primary} />
						</View>
						<View style={styles.recommendedContent}>
							<Text style={styles.recommendedTitle}>Basketball</Text>
							<Text style={styles.recommendedMeta}>12 Facilities</Text>
						</View>
						<View style={styles.recommendedBadge}>
							<Ionicons name="star" size={moderateScale(16)} color="#FFB800" />
						</View>
					</View>
				</View>

				{/* Top Booked Players */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Top Booked Players</Text>
					<TouchableOpacity>
						<Text style={styles.seeAll}>See all</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.playersRow}>
					{topRatedPlayers.map((player, index) => (
						<View key={index} style={styles.playerCard}>
							<View style={styles.playerAvatar}>
								<Text style={styles.playerAvatarText}>{player.name.charAt(0)}</Text>
							</View>
							<Text style={styles.playerName}>{player.name}</Text>
							<Text style={styles.playerRating}>★ {player.rating}</Text>
						</View>
					))}
				</View>

				{/* New Venues */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>New Venues</Text>
				</View>
				<TouchableOpacity
					style={styles.venueCard}
					activeOpacity={0.9}
					onPress={() => navigation.navigate('Venues')}
				>
					<ImageBackground
						source={require('../../assets/login-image.png')}
						style={styles.venueImage}
						imageStyle={styles.venueImageStyle}
					>
						<LinearGradient
							colors={['transparent', 'rgba(0,0,0,0.7)']}
							style={styles.venueGradient}
						>
							<View style={styles.venueInfo}>
								<Text style={styles.venueName}>Play Court Hall</Text>
								<Text style={styles.venueMeta}>Bengaluru • ₹800/hr</Text>
							</View>
							<TouchableOpacity
								style={styles.venueBookButton}
								onPress={() => navigation.navigate('Venues')}
							>
								<Text style={styles.venueBookText}>Book</Text>
							</TouchableOpacity>
						</LinearGradient>
					</ImageBackground>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.venueCard}
					activeOpacity={0.9}
					onPress={() => navigation.navigate('Venues')}
				>
					<ImageBackground
						source={require('../../assets/dashboard-hero.png')}
						style={styles.venueImage}
						imageStyle={styles.venueImageStyle}
					>
						<LinearGradient
							colors={['transparent', 'rgba(0,0,0,0.7)']}
							style={styles.venueGradient}
						>
							<View style={styles.venueInfo}>
								<Text style={styles.venueName}>Badmiton Indoor Collars</Text>
								<Text style={styles.venueMeta}>Hyderabad • ₹600/hr</Text>
							</View>
							<TouchableOpacity
								style={styles.venueBookButton}
								onPress={() => navigation.navigate('Venues')}
							>
								<Text style={styles.venueBookText}>Book</Text>
							</TouchableOpacity>
						</LinearGradient>
					</ImageBackground>
				</TouchableOpacity>

				{/* Padding for bottom nav */}
				<View style={{ height: hp(10) }} />
			</ScrollView>

			{/* Review Reminder Modal */}
			<ReviewReminderModal
				visible={showReviewReminder}
				booking={currentReminderBooking}
				onGiveRating={() => { }} // Handled internally by modal
				onSkip={handleSkipReminder}
				onClose={handleCloseReminder}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5F7FA',
	},
	scrollContent: {
		paddingTop: hp(6),
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: wp(5),
		marginBottom: hp(2),
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	avatar: {
		width: wp(12),
		height: wp(12),
		borderRadius: wp(6),
		backgroundColor: colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: wp(3),
	},
	avatarText: {
		fontSize: fontScale(16),
		fontWeight: '700',
		color: '#fff',
	},
	greeting: {
		fontSize: fontScale(12),
		color: '#999',
	},
	userName: {
		fontSize: fontScale(16),
		fontWeight: '700',
		color: '#333',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileButton: {
		width: wp(10),
		height: wp(10),
		borderRadius: wp(5),
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: wp(2),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	notificationButton: {
		width: wp(10),
		height: wp(10),
		borderRadius: wp(5),
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	searchContainer: {
		flexDirection: 'row',
		paddingHorizontal: wp(5),
		marginBottom: hp(2),
	},
	searchBar: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: moderateScale(12),
		paddingHorizontal: wp(4),
		height: hp(6),
		marginRight: wp(3),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	searchInput: {
		flex: 1,
		marginLeft: wp(2),
		fontSize: fontScale(14),
		color: '#333',
	},
	menuButton: {
		width: hp(6),
		height: hp(6),
		borderRadius: moderateScale(12),
		backgroundColor: colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
	categoryContainer: {
		paddingHorizontal: wp(5),
		marginBottom: hp(2),
	},
	categoryPill: {
		paddingHorizontal: wp(5),
		paddingVertical: hp(1),
		borderRadius: moderateScale(20),
		backgroundColor: '#fff',
		marginRight: wp(2),
	},
	categoryPillActive: {
		backgroundColor: colors.primary,
	},
	categoryText: {
		fontSize: fontScale(13),
		color: '#666',
		fontWeight: '500',
	},
	categoryTextActive: {
		color: '#fff',
		fontWeight: '600',
	},
	heroCard: {
		marginHorizontal: wp(5),
		marginBottom: hp(3),
		borderRadius: moderateScale(20),
		overflow: 'hidden',
		height: hp(22),
	},
	heroGradient: {
		flex: 1,
		flexDirection: 'row',
		padding: wp(5),
	},
	heroImageBackground: {
		borderRadius: moderateScale(20),
	},
	heroOverlay: {
		flex: 1,
		flexDirection: 'row',
		padding: wp(5),
	},
	heroContent: {
		flex: 1,
		justifyContent: 'space-between',
	},
	heroTitle: {
		fontSize: fontScale(20),
		fontWeight: '700',
		color: '#fff',
		marginBottom: hp(0.5),
	},
	heroSubtitle: {
		fontSize: fontScale(12),
		color: 'rgba(255,255,255,0.8)',
		lineHeight: fontScale(18),
	},
	heroButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(255,255,255,0.2)',
		paddingHorizontal: wp(4),
		paddingVertical: hp(1),
		borderRadius: moderateScale(20),
	},
	heroButtonText: {
		fontSize: fontScale(12),
		color: '#fff',
		fontWeight: '600',
		marginRight: wp(1),
	},
	heroImageContainer: {
		width: wp(30),
		justifyContent: 'center',
		alignItems: 'center',
	},
	mockChart: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		height: hp(12),
	},
	chartBar: {
		width: 4,
		backgroundColor: '#4FBB81',
		marginHorizontal: 2,
		borderRadius: 2,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: wp(5),
		marginBottom: hp(1.5),
	},
	sectionTitle: {
		fontSize: fontScale(16),
		fontWeight: '700',
		color: '#333',
	},
	seeAll: {
		fontSize: fontScale(13),
		color: colors.primary,
		fontWeight: '500',
	},
	eventsContainer: {
		paddingHorizontal: wp(5),
		marginBottom: hp(3),
	},
	eventCard: {
		width: wp(35),
		height: hp(18),
		borderRadius: moderateScale(16),
		marginRight: wp(3),
		overflow: 'hidden',
	},
	eventCardContent: {
		flex: 1,
		padding: wp(3),
		justifyContent: 'space-between',
	},
	eventTitle: {
		fontSize: fontScale(14),
		fontWeight: '600',
		color: '#fff',
	},
	eventBookButton: {
		alignSelf: 'flex-start',
		backgroundColor: '#fff',
		paddingHorizontal: wp(4),
		paddingVertical: hp(0.5),
		borderRadius: moderateScale(12),
	},
	eventBookText: {
		fontSize: fontScale(12),
		color: '#333',
		fontWeight: '600',
	},
	eventGradient: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: '50%',
	},
	servicesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingHorizontal: wp(5),
		marginBottom: hp(3),
	},
	serviceItem: {
		width: '20%',
		alignItems: 'center',
		marginBottom: hp(2),
	},
	serviceIcon: {
		width: wp(13),
		height: wp(13),
		borderRadius: wp(6.5),
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: hp(0.5),
	},
	serviceLabel: {
		fontSize: fontScale(11),
		color: '#666',
		textAlign: 'center',
	},
	recommendedList: {
		paddingHorizontal: wp(5),
		marginBottom: hp(3),
	},
	recommendedItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: moderateScale(12),
		padding: wp(3),
		marginBottom: hp(1),
	},
	recommendedIcon: {
		width: wp(10),
		height: wp(10),
		borderRadius: wp(5),
		backgroundColor: '#E0F7F4',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: wp(3),
	},
	recommendedContent: {
		flex: 1,
	},
	recommendedTitle: {
		fontSize: fontScale(14),
		fontWeight: '600',
		color: '#333',
		marginBottom: 2,
	},
	recommendedMeta: {
		fontSize: fontScale(12),
		color: '#999',
	},
	recommendedBadge: {
		padding: wp(1),
	},
	playersRow: {
		flexDirection: 'row',
		paddingHorizontal: wp(5),
		marginBottom: hp(3),
	},
	playerCard: {
		alignItems: 'center',
		marginRight: wp(5),
	},
	playerAvatar: {
		width: wp(16),
		height: wp(16),
		borderRadius: wp(8),
		backgroundColor: colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: hp(0.5),
	},
	playerAvatarText: {
		fontSize: fontScale(18),
		fontWeight: '700',
		color: '#fff',
	},
	playerName: {
		fontSize: fontScale(13),
		fontWeight: '600',
		color: '#333',
		marginBottom: 2,
	},
	playerRating: {
		fontSize: fontScale(12),
		color: '#FFB800',
	},
	venueCard: {
		marginHorizontal: wp(5),
		marginBottom: hp(2),
		borderRadius: moderateScale(16),
		overflow: 'hidden',
		height: hp(25),
	},
	venueImage: {
		width: '100%',
		height: '100%',
	},
	venueImageStyle: {
		borderRadius: moderateScale(16),
	},
	venueGradient: {
		flex: 1,
		justifyContent: 'flex-end',
		padding: wp(4),
	},
	venueInfo: {
		marginBottom: hp(1),
	},
	venueName: {
		fontSize: fontScale(16),
		fontWeight: '700',
		color: '#fff',
		marginBottom: 4,
	},
	venueMeta: {
		fontSize: fontScale(13),
		color: 'rgba(255,255,255,0.9)',
	},
	venueBookButton: {
		alignSelf: 'flex-start',
		backgroundColor: '#FF4757',
		paddingHorizontal: wp(6),
		paddingVertical: hp(0.8),
		borderRadius: moderateScale(20),
	},
	venueBookText: {
		fontSize: fontScale(13),
		color: '#fff',
		fontWeight: '600',
	},
});

export default HomeScreen;
