import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/ui/Button';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

// Mock Data
const AGE_GROUPS = ['Kids (5-12)', 'Teens (13-18)', 'Adults (18+)'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
const SPORTS = ['Pickleball', 'Badminton', 'Tennis', 'Padel'];

const FEATURED_COACHES = [
    {
        id: '1',
        name: 'Rahul Sharma',
        sport: 'Pickleball',
        rating: 4.8,
        experience: '5 Yrs',
        rate: '₹800/hr',
        image: null // Placeholder
    },
    {
        id: '2',
        name: 'Sarah Jenkins',
        sport: 'Tennis',
        rating: 4.9,
        experience: '8 Yrs',
        rate: '₹1200/hr',
        image: null
    },
    {
        id: '3',
        name: 'Mike Chen',
        sport: 'Badminton',
        rating: 4.7,
        experience: '4 Yrs',
        rate: '₹700/hr',
        image: null
    }
];

const TOP_ACADEMIES = [
    {
        id: '1',
        name: 'Smash Academy',
        location: 'Madhapur, Hyderabad',
        sports: ['Badminton', 'Pickleball'],
        rating: 4.5,
        reviewCount: 120,
        image: null
    },
    {
        id: '2',
        name: 'Pro Tennis Club',
        location: 'Gachibowli, Hyderabad',
        sports: ['Tennis'],
        rating: 4.8,
        reviewCount: 85,
        image: null
    }
];

const TrainScreen = () => {
    const navigation = useNavigation<Navigation>();
    const [selectedAge, setSelectedAge] = useState('Adults (18+)');
    const [selectedLevel, setSelectedLevel] = useState('Intermediate');
    const [selectedSport, setSelectedSport] = useState('Pickleball');

    const renderCoachCard = ({ item }: { item: typeof FEATURED_COACHES[0] }) => (
        <TouchableOpacity
            style={styles.coachCard}
            onPress={() => navigation.navigate('CoachDetails' as any, { coachId: item.id })}
        >
            <View style={styles.coachImagePlaceholder}>
                <LinearGradient colors={['#2C2C2E', '#1C1C1E']} style={StyleSheet.absoluteFill} />
                <Text style={styles.placeholderText}>{item.name[0]}</Text>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>
            <View style={styles.coachInfo}>
                <Text style={styles.coachName}>{item.name}</Text>
                <Text style={styles.coachSport}>{item.sport}</Text>
                <View style={styles.coachMetaRow}>
                    <Text style={styles.coachMeta}>{item.experience}</Text>
                    <Text style={styles.coachRate}>{item.rate}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderAcademyCard = ({ item }: { item: typeof TOP_ACADEMIES[0] }) => (
        <TouchableOpacity style={styles.academyCard}>
            <View style={styles.academyImagePlaceholder}>
                <LinearGradient colors={['#102a19', '#1A1A1A']} style={StyleSheet.absoluteFill} />
                <Ionicons name="business" size={24} color={colors.primary} />
            </View>
            <View style={styles.academyContent}>
                <View style={styles.academyHeader}>
                    <Text style={styles.academyName}>{item.name}</Text>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating} ({item.reviewCount})</Text>
                    </View>
                </View>
                <Text style={styles.academyLocation}>{item.location}</Text>
                <View style={styles.skillsRow}>
                    {item.sports.map((sport, index) => (
                        <View key={index} style={styles.skillBadge}>
                            <Text style={styles.skillText}>{sport}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>MyRush Academy</Text>
                    <Text style={styles.headerSubtitle}>Train with potential</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* Filters Section */}
                <View style={styles.filterSection}>
                    <Text style={styles.sectionTitle}>Customize your training</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {AGE_GROUPS.map(age => (
                            <TouchableOpacity
                                key={age}
                                style={[styles.filterChip, selectedAge === age && styles.activeChip]}
                                onPress={() => setSelectedAge(age)}
                            >
                                <Text style={[styles.filterText, selectedAge === age && styles.activeFilterText]}>{age}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {SPORTS.map(sport => (
                            <TouchableOpacity
                                key={sport}
                                style={[styles.filterChip, selectedSport === sport && styles.activeChip]}
                                onPress={() => setSelectedSport(sport)}
                            >
                                <Text style={[styles.filterText, selectedSport === sport && styles.activeFilterText]}>{sport}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {SKILL_LEVELS.map(level => (
                            <TouchableOpacity
                                key={level}
                                style={[styles.filterChip, selectedLevel === level && styles.activeChip]}
                                onPress={() => setSelectedLevel(level)}
                            >
                                <Text style={[styles.filterText, selectedLevel === level && styles.activeFilterText]}>{level}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Featured Coaches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>Featured Coaches</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        data={FEATURED_COACHES}
                        renderItem={renderCoachCard}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* Top Academies */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Top Academies</Text>
                    <FlatList
                        data={TOP_ACADEMIES}
                        renderItem={renderAcademyCard}
                        keyExtractor={item => item.id}
                        scrollEnabled={false} // Since inside ScrollView
                    />
                </View>

                {/* Promo Banner */}
                <View style={styles.promoBanner}>
                    <LinearGradient
                        colors={[colors.primary, '#2ecc71']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.promoContent}>
                        <Text style={styles.promoTitle}>Summer Camp 2025</Text>
                        <Text style={styles.promoText}>Registration open for kids & teens. Early bird 20% off!</Text>
                        <Button
                            title="Learn More"
                            onPress={() => { }}
                            style={styles.promoButton}
                            textStyle={{ color: colors.primary }}
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    headerTitle: {
        fontSize: fontScale(24),
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: fontScale(14),
        color: colors.text.secondary,
        marginTop: 4,
    },
    scrollView: {
        flex: 1,
    },
    filterSection: {
        paddingVertical: hp(2),
    },
    sectionTitle: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#FFF',
        marginLeft: wp(5),
        marginBottom: hp(1.5),
    },
    filterRow: {
        marginBottom: hp(1.5),
        paddingHorizontal: wp(5),
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1C1C1E',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    activeChip: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        color: '#CCC',
        fontSize: fontScale(13),
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#000',
        fontWeight: 'bold',
    },
    section: {
        marginTop: hp(2),
        paddingBottom: hp(2),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        marginBottom: hp(1.5),
    },
    sectionHeader: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
        paddingHorizontal: wp(5),
        marginBottom: hp(1.5),
    },
    seeAllText: {
        color: colors.primary,
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: wp(5),
        paddingBottom: 10,
    },
    coachCard: {
        width: wp(40),
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        marginRight: wp(4),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    coachImagePlaceholder: {
        height: wp(35),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    placeholderText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#555',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 2,
    },
    ratingText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    coachInfo: {
        padding: 12,
    },
    coachName: {
        color: '#FFF',
        fontSize: fontScale(14),
        fontWeight: 'bold',
        marginBottom: 2,
    },
    coachSport: {
        color: colors.text.secondary,
        fontSize: fontScale(12),
        marginBottom: 8,
    },
    coachMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coachMeta: {
        color: '#888',
        fontSize: 10,
    },
    coachRate: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    academyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        marginHorizontal: wp(5),
        marginBottom: hp(1.5),
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    academyImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    academyContent: {
        flex: 1,
    },
    academyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    academyName: {
        color: '#FFF',
        fontSize: fontScale(15),
        fontWeight: 'bold',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    academyLocation: {
        color: '#888',
        fontSize: fontScale(12),
        marginBottom: 6,
    },
    skillsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    skillBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    skillText: {
        color: '#BBB',
        fontSize: 10,
    },
    promoBanner: {
        marginHorizontal: wp(5),
        marginTop: hp(2),
        borderRadius: 16,
        overflow: 'hidden',
        height: hp(18),
        position: 'relative',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    promoContent: {
        zIndex: 1,
    },
    promoTitle: {
        color: '#000',
        fontSize: fontScale(20),
        fontWeight: '900',
        marginBottom: 4,
    },
    promoText: {
        color: '#111',
        fontSize: fontScale(12),
        maxWidth: '70%',
        marginBottom: 12,
        fontWeight: '500',
    },
    promoButton: {
        backgroundColor: '#FFF',
        paddingVertical: 8,
        width: 120,
        borderRadius: 20,
    }
});

export default TrainScreen;
