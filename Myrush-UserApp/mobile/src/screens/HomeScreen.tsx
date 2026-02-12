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
	Modal,
	FlatList,
	TouchableWithoutFeedback,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SpinWheelModal } from '../components/SpinWheelModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { RootStackParamList } from '../types';
import { Container } from '../components/common/Container';
import { profileApi, City, ProfileData } from '../api/profile';
import { venuesApi, Venue } from '../api/venues';

const { width } = Dimensions.get('window');

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
	const { user } = useAuthStore();
	const navigation = useNavigation<Navigation>();
	const [searchQuery, setSearchQuery] = useState('');
	const [activeCategory, setActiveCategory] = useState('Sports');
	const [spinModalVisible, setSpinModalVisible] = useState(false);

	// City Selection State
	const [cities, setCities] = useState<City[]>([]);
	const [isCityModalVisible, setCityModalVisible] = useState(false);
	const [isUpdatingCity, setIsUpdatingCity] = useState(false);

	// Venues State
	const [venues, setVenues] = useState<Venue[]>([]);
	const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
	const [isLoadingVenues, setIsLoadingVenues] = useState(true);

	useEffect(() => {
		loadCities();
		loadVenues();
	}, []);

	const loadCities = async () => {
		const response = await profileApi.getCities();
		if (response.success) {
			setCities(response.data);
		}
	};

	const loadVenues = async () => {
		setIsLoadingVenues(true);
		// Optionally filter by user's city if available, for now fetch all
		const response = await venuesApi.getVenues();
		if (response.success) {
			setVenues(response.data);
			setFilteredVenues(response.data);
		} else {
			Alert.alert('Error', 'Failed to fetch venues');
		}
		setIsLoadingVenues(false);
	};

	const handleUpdateCity = async (selectedCity: City) => {
		setIsUpdatingCity(true);
		try {
			// 1. Fetch current full profile data (needed for save payload)
			const profileRes = await profileApi.getProfile('');
			if (!profileRes.success || !profileRes.data) {
				Alert.alert('Error', 'Could not retrieve user profile to update.');
				return;
			}

			const currentData = profileRes.data as ProfileData;

			// 2. Prepare payload with NEW city but EXISTING other data
			const payload = {
				phoneNumber: currentData.phone_number,
				fullName: currentData.full_name,
				age: currentData.age,
				city: selectedCity.name,
				city_id: selectedCity.id,
				gender: currentData.gender,
				handedness: currentData.handedness,
				skillLevel: currentData.skill_level,
				sports: currentData.sports,
				playingStyle: currentData.playing_style
			};

			// 3. Save Profile
			const saveRes = await profileApi.saveProfile(payload);
			if (saveRes.success) {
				// 4. Update Auth Store (so Header reflects change instantly)
				await useAuthStore.getState().checkAuth();
				setCityModalVisible(false);
				// Refresh venues if needed based on new city
				// loadVenues(); 
			} else {
				Alert.alert('Update Failed', saveRes.message || 'Failed to update city.');
			}

		} catch (error) {
			console.error('Failed to update city:', error);
			Alert.alert('Error', 'An error occurred while updating city.');
		} finally {
			setIsUpdatingCity(false);
		}
	};

	const displayName = user?.fullName?.split(' ')[0] || user?.firstName || 'Alex';

	// Updated categories to match venue types better
	const categories = ['Sports', 'Football', 'Cricket', 'Badminton'];

	const quickActions = [
		{ icon: 'football', label: 'Book Court', color: colors.primary, route: 'Venues' },
		{ icon: 'card', label: 'Payments', color: colors.primary, route: 'Payments' },
		// { icon: 'chatbubble', label: 'Support', color: colors.primary, route: 'Support' },
		// { icon: 'cart', label: 'Store', color: colors.primary, route: 'Store' },
		// { icon: 'trophy', label: 'Events', color: colors.primary, route: 'Events' },
	];

	useEffect(() => {
		let result = venues;

		// 1. Search Filter
		if (searchQuery) {
			result = result.filter(venue =>
				venue.court_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				venue.game_type.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// 2. Category Filter
		if (activeCategory && activeCategory !== 'Sports') {
			result = result.filter(venue => venue.game_type.includes(activeCategory));
		}

		setFilteredVenues(result);
	}, [searchQuery, activeCategory, venues]);

	const topRatedPlayers = [
		{ name: 'John S', rating: 4.9 },
		{ name: 'Sarah M', rating: 4.8 },
		{ name: 'Mike T', rating: 4.7 },
		{ name: 'Emma W', rating: 4.9 },
	];

	return (
		<Container scrollable={false} backgroundColor="#000000" padding={false}>
			<View style={{ flex: 1 }}>
				{/* Sticky Header */}
				<View style={[styles.header, { paddingHorizontal: moderateScale(20), paddingTop: hp(2), marginBottom: 0, paddingBottom: spacing.md, backgroundColor: '#000' }]}>
					<TouchableOpacity
						style={styles.locationRow}
						onPress={() => setCityModalVisible(true)}
					>
						<Ionicons name="location-sharp" size={moderateScale(16)} color="#fff" />
						<View>
							<Text style={styles.locationLabel}>LOCATION</Text>
							<Text style={styles.locationValue}>{user?.city || 'Select City'}</Text>
						</View>
						<Ionicons name="caret-down" size={moderateScale(12)} color="#888" style={{ marginLeft: 4, marginTop: 12 }} />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.notificationButton, user?.avatarUrl ? { padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: '#333' } : {}]}
						onPress={() => navigation.navigate('ProfileOverview')}
					>
						{user?.avatarUrl ? (
							<Image
								source={{ uri: user.avatarUrl }}
								style={{ width: '100%', height: '100%' }}
								resizeMode="cover"
							/>
						) : (
							<Ionicons name="person" size={moderateScale(20)} color="#fff" />
						)}
					</TouchableOpacity>
				</View>


				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.content}>

						{/* Welcome */}
						<View style={styles.welcomeContainer}>
							<Text style={styles.welcomeText}>
								Welcome, <Text style={styles.userName}>{displayName}!</Text> 👋
							</Text>
							<Text style={styles.subWelcome}>Ready to play?</Text>
						</View>

						{/* Search */}
						<View style={styles.searchContainer}>
							<Ionicons name="search" size={moderateScale(20)} color="#9CA3AF" style={styles.searchIcon} />
							<TextInput
								style={styles.searchInput}
								placeholder="Search for games..."
								placeholderTextColor="#6B7280"
								value={searchQuery}
								onChangeText={setSearchQuery}
							/>
						</View>

						{/* Categories */}
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoryContainer}
						>
							{categories.map((category) => (
								<TouchableOpacity
									key={category}
									style={[
										styles.categoryPill,
										activeCategory === category && styles.categoryPillActive,
									]}
									onPress={() => setActiveCategory(category)}
								>
									<Text
										style={[
											styles.categoryText,
											activeCategory === category && styles.categoryTextActive,
										]}
									>
										{category}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>

						{/* Game On Section */}
						<Text style={styles.sectionTitle}>Game On</Text>
						<TouchableOpacity style={styles.liveMatchCard} activeOpacity={0.9}>
							<LinearGradient
								colors={['#2D5C35', '#1A2F23', '#000000']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.liveMatchGradient}
							>
								<View style={styles.liveBadge}>
									<View style={styles.liveDot} />
									<Text style={styles.liveText}>LIVE</Text>
								</View>

								<View style={styles.matchInfo}>
									<Text style={styles.leagueName}>PREMIER LEAGUE</Text>
									<Text style={styles.matchVs}>Man City vs Arsenal</Text>
								</View>

								<View style={styles.matchGraphic}>
									<Ionicons name="football" size={moderateScale(60)} color="rgba(255,255,255,0.2)" />
								</View>
							</LinearGradient>
						</TouchableOpacity>

						{/* Our Services */}
						<View style={styles.servicesGrid}>
							{quickActions.map((action, index) => (
								<TouchableOpacity
									key={index}
									style={styles.serviceItem}
									onPress={() => navigation.navigate(action.route as any)}
								>
									<View style={styles.serviceIconContainer}>
										<Ionicons name={action.icon as any} size={moderateScale(20)} color={colors.primary} />
									</View>
									<Text style={styles.serviceLabel}>{action.label}</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Nearby Venues */}
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Nearby Venues</Text>
							<TouchableOpacity onPress={() => navigation.navigate('Venues')}>
								<Text style={styles.viewAll}>View All</Text>
							</TouchableOpacity>
						</View>

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.venuesList}
						>
							{isLoadingVenues ? (
								<ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 20 }} />
							) : filteredVenues.length > 0 ? (
								filteredVenues.map((venue) => (
									<TouchableOpacity
										key={venue.id}
										style={styles.venueCard}
										onPress={() => navigation.navigate('VenueDetails', { venue: venue })}
									>
										<View style={styles.venueImageContainer}>
											{venue.photos && venue.photos.length > 0 ? (
												<Image source={{ uri: venue.photos[0] }} style={styles.venueImage} resizeMode="cover" />
											) : (
												<View style={[styles.venueImage, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
													<Ionicons name="image-outline" size={24} color="#666" />
												</View>
											)}
										</View>
										<View style={styles.venueInfo}>
											<Text style={styles.venueName} numberOfLines={1}>{venue.court_name}</Text>
											<Text style={styles.venueMeta} numberOfLines={1}>{venue.game_type} • {venue.location}</Text>
										</View>
									</TouchableOpacity>
								))
							) : (
								<Text style={{ color: '#6B7280', padding: 20 }}>No venues found.</Text>
							)}
						</ScrollView>

						{/* Trending Events */}
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Trending Events</Text>
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.eventsContainer}
						>
							<TouchableOpacity style={[styles.eventCard, { backgroundColor: '#1A1A1A' }]} onPress={() => navigation.navigate('Venues')}>
								<View style={styles.eventCardContent}>
									<Text style={styles.eventTitle}>Badminton Cup</Text>
									<Text style={styles.eventSubtitle}>Join Now</Text>
								</View>
								<Ionicons name="trophy-outline" size={40} color={colors.primary} style={{ position: 'absolute', right: 10, bottom: 10, opacity: 0.2 }} />
							</TouchableOpacity>

							<TouchableOpacity style={[styles.eventCard, { backgroundColor: '#1A1A1A' }]} onPress={() => navigation.navigate('Venues')}>
								<View style={styles.eventCardContent}>
									<Text style={styles.eventTitle}>Weekend Football</Text>
									<Text style={styles.eventSubtitle}>Book Slot</Text>
								</View>
								<Ionicons name="football-outline" size={40} color={colors.primary} style={{ position: 'absolute', right: 10, bottom: 10, opacity: 0.2 }} />
							</TouchableOpacity>
						</ScrollView>

						{/* Top Recommended */}
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Top Recommended</Text>
						</View>
						<View style={styles.recommendedList}>
							<TouchableOpacity style={styles.recommendedItem}>
								<View style={styles.recommendedIcon}>
									<Ionicons name="tennisball" size={moderateScale(18)} color={colors.primary} />
								</View>
								<View style={styles.recommendedContent}>
									<Text style={styles.recommendedTitle}>MyRush AI Referee</Text>
									<Text style={styles.recommendedMeta}>Try it now</Text>
								</View>
								<Ionicons name="chevron-forward" size={16} color="#666" />
							</TouchableOpacity>

							<TouchableOpacity style={styles.recommendedItem}>
								<View style={styles.recommendedIcon}>
									<Ionicons name="basketball" size={moderateScale(18)} color={colors.primary} />
								</View>
								<View style={styles.recommendedContent}>
									<Text style={styles.recommendedTitle}>Pro Coaching</Text>
									<Text style={styles.recommendedMeta}>Find coaches nearby</Text>
								</View>
								<Ionicons name="chevron-forward" size={16} color="#666" />
							</TouchableOpacity>
						</View>

						{/* Top Booked Players */}
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Top Players</Text>
						</View>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersRow}>
							{topRatedPlayers.map((player, index) => (
								<View key={index} style={styles.playerCard}>
									<View style={styles.playerAvatar}>
										<Text style={styles.playerAvatarText}>{player.name.charAt(0)}</Text>
									</View>
									<Text style={styles.playerName}>{player.name}</Text>
									<View style={styles.ratingBadge}>
										<Ionicons name="star" size={8} color="#000" />
										<Text style={styles.playerRating}>{player.rating}</Text>
									</View>
								</View>
							))}
						</ScrollView>

						{/* Daily Spin Trigger */}
						<TouchableOpacity
							style={styles.spinCard}
							onPress={() => setSpinModalVisible(true)}
						>
							<LinearGradient
								colors={['#7F00FF', '#E100FF']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.spinGradient}
							>
								<View style={styles.spinContent}>
									<Text style={styles.spinTitle}>Daily Spin & Win</Text>
									<Text style={styles.spinSubtitle}>Get your daily rewards now!</Text>
								</View>
								<MaterialCommunityIcons name="gift-outline" size={40} color="#FFF" />
							</LinearGradient>
						</TouchableOpacity>

						{/* Bottom Padding handled by container style */}
					</View>
				</ScrollView>

				<SpinWheelModal
					visible={spinModalVisible}
					onClose={() => setSpinModalVisible(false)}
				/>

				{/* City Selection Modal */}
				<Modal
					visible={isCityModalVisible}
					transparent={true}
					animationType="fade"
					onRequestClose={() => setCityModalVisible(false)}
				>
					<TouchableWithoutFeedback onPress={() => setCityModalVisible(false)}>
						<View style={styles.modalOverlay}>
							<TouchableWithoutFeedback onPress={() => { }}>
								<View style={styles.modalContent}>
									<Text style={styles.modalTitle}>Select City</Text>

									{isUpdatingCity ? (
										<View style={{ padding: 20, alignItems: 'center' }}>
											<ActivityIndicator size="large" color={colors.primary} />
											<Text style={{ color: '#aaa', marginTop: 10 }}>Updating Location...</Text>
										</View>
									) : (
										<FlatList
											data={cities}
											keyExtractor={(item) => item.id}
											renderItem={({ item }) => (
												<TouchableOpacity
													style={styles.modalItem}
													onPress={() => handleUpdateCity(item)}
												>
													<Text style={styles.modalItemText}>{item.name}</Text>
													{user?.city === item.name && (
														<Ionicons name="checkmark-circle" size={20} color={colors.primary} />
													)}
												</TouchableOpacity>
											)}
											ListEmptyComponent={
												<Text style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>
													Loading cities...
												</Text>
											}
										/>
									)}

									<TouchableOpacity
										style={styles.closeButton}
										onPress={() => setCityModalVisible(false)}
									>
										<Text style={styles.closeButtonText}>Cancel</Text>
									</TouchableOpacity>
								</View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
			</View>
		</Container>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: moderateScale(100), // Increased to ensure clearance above TabBar and Android Nav Bar
	},
	content: {
		paddingHorizontal: moderateScale(20),
		paddingTop: hp(2),
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.xl,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
	},
	locationLabel: {
		...typography.caption,
		fontSize: 10,
		color: '#9CA3AF',
		letterSpacing: 1,
		fontWeight: '700',
	},
	locationValue: {
		...typography.bodySmall,
		color: '#fff',
		fontWeight: '600',
		lineHeight: 14,
	},
	notificationButton: {
		width: moderateScale(40),
		height: moderateScale(40),
		borderRadius: borderRadius.full,
		backgroundColor: '#1C1C1E',
		justifyContent: 'center',
		alignItems: 'center',
	},
	welcomeContainer: {
		marginBottom: spacing.lg,
	},
	welcomeText: {
		...typography.h1, // Lexend Black
		fontSize: 28,
		color: '#fff',
	},
	userName: {
		color: '#fff',
	},
	subWelcome: {
		...typography.body,
		color: '#9CA3AF',
		marginTop: spacing.xs,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#1A1A1A',
		borderRadius: borderRadius.full,
		paddingHorizontal: spacing.md,
		height: moderateScale(50),
		borderWidth: 1,
		borderColor: '#333',
		marginBottom: spacing.lg,
	},
	searchIcon: {
		marginRight: spacing.sm,
	},
	searchInput: {
		flex: 1,
		color: '#fff',
		fontFamily: 'Lexend_400Regular',
		fontSize: fontScale(14),
	},
	// Categories
	categoryContainer: {
		marginBottom: spacing.xl,
	},
	categoryPill: {
		paddingHorizontal: spacing.lg,
		paddingVertical: 8,
		borderRadius: borderRadius.full,
		backgroundColor: '#1C1C1E',
		marginRight: spacing.sm,
		borderWidth: 1,
		borderColor: 'transparent',
	},
	categoryPillActive: {
		backgroundColor: '#1C1C1E',
		borderColor: colors.primary,
	},
	categoryText: {
		...typography.label,
		color: '#9CA3AF',
	},
	categoryTextActive: {
		color: colors.primary,
	},
	sectionTitle: {
		...typography.h3,
		color: '#fff',
		marginBottom: spacing.md,
	},
	liveMatchCard: {
		height: hp(18),
		borderRadius: borderRadius['2xl'],
		overflow: 'hidden',
		marginBottom: spacing.xl,
	},
	liveMatchGradient: {
		flex: 1,
		padding: spacing.lg,
		position: 'relative',
		justifyContent: 'space-between',
	},
	liveBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FF4757',
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: 4,
		alignSelf: 'flex-start',
	},
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#fff',
		marginRight: 4,
	},
	liveText: {
		fontSize: 10,
		fontWeight: '700',
		color: '#fff',
	},
	matchInfo: {
		zIndex: 2,
	},
	leagueName: {
		fontSize: 10,
		fontWeight: '700',
		color: '#39E079', // Neon
		letterSpacing: 1,
		marginBottom: 4,
	},
	matchVs: {
		...typography.h4,
		color: '#fff',
		fontSize: 18,
	},
	matchGraphic: {
		position: 'absolute',
		right: -10,
		bottom: -10,
		opacity: 0.5,
	},
	// Services
	servicesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: spacing.xl,
	},
	serviceItem: {
		width: '18%',
		alignItems: 'center',
	},
	serviceIconContainer: {
		width: moderateScale(48),
		height: moderateScale(48),
		borderRadius: borderRadius.full,
		backgroundColor: '#1C1C1E',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: spacing.xs,
		borderWidth: 1,
		borderColor: '#333',
	},
	serviceLabel: {
		...typography.caption,
		fontSize: 10,
		color: '#9CA3AF',
		textAlign: 'center',
	},
	// Sections
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.md,
	},
	viewAll: {
		fontSize: 12,
		fontWeight: '600',
		color: '#39E079',
	},
	venuesList: {
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	venueCard: {
		width: wp(40),
		marginRight: spacing.sm,
	},
	venueImageContainer: {
		height: hp(12),
		width: '100%',
		borderRadius: 16,
		overflow: 'hidden',
		marginBottom: spacing.sm,
	},
	venueImage: {
		width: '100%',
		height: '100%',
	},
	venueInfo: {
		paddingHorizontal: 4,
	},
	venueName: {
		...typography.h5,
		fontSize: 14,
		color: '#fff',
		marginBottom: 2,
	},
	venueMeta: {
		fontSize: 11,
		color: '#9CA3AF',
		fontFamily: 'Lexend_400Regular',
	},
	// Events
	eventsContainer: {
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	eventCard: {
		width: wp(40),
		height: hp(12),
		backgroundColor: '#1A1A1A',
		borderRadius: borderRadius.xl,
		padding: spacing.md,
		justifyContent: 'space-between',
		overflow: 'hidden',
	},
	eventCardContent: {
		zIndex: 2,
	},
	eventTitle: {
		...typography.h5,
		fontSize: 14,
		color: '#fff',
		marginBottom: 4,
	},
	eventSubtitle: {
		...typography.caption,
		color: colors.primary,
		fontWeight: '700',
	},
	// Recommended
	recommendedList: {
		marginBottom: spacing.xl,
		gap: spacing.md,
	},
	recommendedItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#1C1C1E',
		padding: spacing.md,
		borderRadius: borderRadius.xl,
	},
	recommendedIcon: {
		width: moderateScale(36),
		height: moderateScale(36),
		borderRadius: borderRadius.full,
		backgroundColor: '#000',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: spacing.md,
		borderWidth: 1,
		borderColor: '#333',
	},
	recommendedContent: {
		flex: 1,
	},
	recommendedTitle: {
		...typography.body,
		fontWeight: '600',
		color: '#fff',
	},
	recommendedMeta: {
		...typography.caption,
		color: '#9CA3AF',
	},
	// Players
	playersRow: {
		gap: spacing.lg,
		paddingRight: spacing.xl,
	},
	playerCard: {
		alignItems: 'center',
	},
	playerAvatar: {
		width: moderateScale(56),
		height: moderateScale(56),
		borderRadius: borderRadius.full,
		backgroundColor: '#1C1C1E',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.primary,
		marginBottom: spacing.xs,
	},
	playerAvatarText: {
		...typography.h4,
		color: '#fff',
	},
	playerName: {
		...typography.caption,
		color: '#fff',
		marginBottom: 4,
	},
	ratingBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.primary,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 8,
		gap: 2,
	},
	playerRating: {
		fontSize: 10,
		fontWeight: '700',
		color: '#000',
	},
	spinCard: {
		marginTop: spacing.xl,
		borderRadius: borderRadius.xl,
		overflow: 'hidden',
		marginBottom: spacing.xl,
	},
	spinGradient: {
		padding: spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	spinContent: {
		flex: 1,
	},
	spinTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#FFF',
		marginBottom: 4,
	},
	spinSubtitle: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.9)',
	},
	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#1E1E1E',
		borderRadius: 16,
		width: '100%',
		maxHeight: '60%',
		padding: 20,
		borderWidth: 1,
		borderColor: '#333',
	},
	modalTitle: {
		color: '#FFF',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 15,
		textAlign: 'center',
	},
	modalItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	modalItemText: {
		color: '#FFF',
		fontSize: 16,
	},
	closeButton: {
		marginTop: 20,
		backgroundColor: '#333',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	closeButtonText: {
		color: '#FFF',
		fontWeight: 'bold',
		fontSize: 16,
	},
});
