import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
	const { user } = useAuthStore();
	const navigation = useNavigation<Navigation>();
	const [searchQuery, setSearchQuery] = useState('');
	const [activeCategory, setActiveCategory] = useState('Sports');
	const [spinModalVisible, setSpinModalVisible] = useState(false);

	const displayName = user?.fullName?.split(' ')[0] || user?.firstName || 'Alex';

	const categories = ['Sports', 'Game', 'Squad', 'Field', 'Badminton'];

	const quickActions = [
		{ icon: 'football', label: 'Book Court', color: colors.primary, route: 'Venues' },
		{ icon: 'card', label: 'Payments', color: colors.primary, route: 'Payments' },
		{ icon: 'chatbubble', label: 'Support', color: colors.primary, route: 'Support' },
		{ icon: 'cart', label: 'Store', color: colors.primary, route: 'Store' },
		{ icon: 'trophy', label: 'Events', color: colors.primary, route: 'Events' },
	];

	const nearbyVenues = [
		{
			id: '1',
			name: 'Central Arena',
			type: 'Football',
			distance: '2km',
			image: require('../../assets/fieldbooking.png'),
		},
		{
			id: '2',
			name: 'Urban Turf',
			type: 'Cricket',
			distance: '5km',
			image: null,
		},
		{
			id: '3',
			name: 'Smash Court',
			type: 'Badminton',
			distance: '3km',
			image: require('../../assets/dashboard-hero.png'),
		},
	];

	const topRatedPlayers = [
		{ name: 'John S', rating: 4.9 },
		{ name: 'Sarah M', rating: 4.8 },
		{ name: 'Mike T', rating: 4.7 },
		{ name: 'Emma W', rating: 4.9 },
	];

	return (
		<Container scrollable={false} backgroundColor="#000000" padding={false}>
			<View style={{ flex: 1 }}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.content}>

						{/* Header */}
						<View style={styles.header}>
							<View style={styles.locationRow}>
								<Ionicons name="location-sharp" size={moderateScale(16)} color="#fff" />
								<View>
									<Text style={styles.locationLabel}>LOCATION</Text>
									<Text style={styles.locationValue}>{user?.city || 'Select City'}</Text>
								</View>
							</View>
							<TouchableOpacity
								style={styles.notificationButton}
								onPress={() => navigation.navigate('ProfileOverview')}
							>
								<Ionicons name="person" size={moderateScale(20)} color="#fff" />
							</TouchableOpacity>
						</View>

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
							{nearbyVenues.map((venue) => (
								<TouchableOpacity
									key={venue.id}
									style={styles.venueCard}
									onPress={() => navigation.navigate('Venues')}
								>
									<View style={styles.venueImageContainer}>
										{venue.image ? (
											<Image source={venue.image} style={styles.venueImage} resizeMode="cover" />
										) : (
											<View style={[styles.venueImage, { backgroundColor: '#333' }]} />
										)}
									</View>
									<View style={styles.venueInfo}>
										<Text style={styles.venueName}>{venue.name}</Text>
										<Text style={styles.venueMeta}>{venue.type} • {venue.distance}</Text>
									</View>
								</TouchableOpacity>
							))}
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
			</View>
		</Container>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: moderateScale(15), // Matches TabBar height exactly, no extra gap
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
});
