import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    ScrollView,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/ui/Button';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

// Mock Coach Data - In real app, fetch from API based on ID
const MOCK_COACH = {
    id: '1',
    name: 'Rahul Sharma',
    sport: 'Pickleball',
    rating: 4.8,
    reviewCount: 42,
    experience: '5 Years',
    bio: 'Professional Pickleball coach with 5 years of experience training beginners and intermediates. Former state champion.',
    specialties: ['Doubles Strategy', 'Dinking', 'Serve & Volley'],
    venues: [
        { id: 'v1', name: 'Smash Academy', location: 'Madhapur' },
        { id: 'v2', name: 'GamePoint', location: 'Hitech City' }
    ],
    rate: 800
};

const CoachDetailsScreen = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const { coachId } = route.params as { coachId: string };

    // In real app, use coachId to fetch data
    const coach = MOCK_COACH;

    const [selectedVenue, setSelectedVenue] = useState(coach.venues[0]);

    const handleBookSession = () => {
        // Navigate to existing SlotSelectionScreen, passing coach context
        // We'll treat the coach booking like a venue booking but with specific price/context
        navigation.navigate('SlotSelection', {
            venueId: selectedVenue.id,
            venueName: selectedVenue.name, // Display Venue Name
            sport: coach.sport,
            // You might need to update SlotSelection to handle "Coach Booking" specifics later
            // For now, reusing standard flow
        } as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header / Hero Image */}
            <View style={styles.heroContainer}>
                <LinearGradient colors={['#2C2C2E', '#1C1C1E']} style={StyleSheet.absoluteFill} />
                <View style={styles.placeholderHero}>
                    <Text style={styles.heroInitials}>{coach.name[0]}</Text>
                </View>

                {/* Back Button */}
                <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </SafeAreaView>

                {/* Gradient Overlay for Text Readability */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.heroGradient}
                />
            </View>

            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Coach Info Header */}
                <View style={styles.infoSection}>
                    <View style={styles.nameRow}>
                        <Text style={styles.coachName}>{coach.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>{coach.rating} ({coach.reviewCount})</Text>
                        </View>
                    </View>
                    <Text style={styles.coachSport}>{coach.sport} Coach • {coach.experience} Exp</Text>
                </View>

                {/* Bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Coach</Text>
                    <Text style={styles.bioText}>{coach.bio}</Text>
                </View>

                {/* Specialties */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Specialties</Text>
                    <View style={styles.tagsRow}>
                        {coach.specialties.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Teaching At */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Teaching At</Text>
                    {coach.venues.map(venue => (
                        <TouchableOpacity
                            key={venue.id}
                            style={[styles.venueOption, selectedVenue.id === venue.id && styles.selectedVenue]}
                            onPress={() => setSelectedVenue(venue)}
                        >
                            <View style={styles.venueInfo}>
                                <Text style={[styles.venueName, selectedVenue.id === venue.id && { color: colors.primary }]}>{venue.name}</Text>
                                <Text style={styles.venueLocation}>{venue.location}</Text>
                            </View>
                            {selectedVenue.id === venue.id && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Booking Bar */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.priceLabel}>Price per session</Text>
                    <Text style={styles.priceValue}>₹{coach.rate}<Text style={styles.priceUnit}>/hr</Text></Text>
                </View>
                <Button
                    title="Book Session"
                    onPress={handleBookSession}
                    style={{ width: wp(45) }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    heroContainer: {
        height: hp(35),
        position: 'relative',
    },
    placeholderHero: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroInitials: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#444',
    },
    headerSafeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        marginLeft: 20,
        marginTop: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    contentContainer: {
        flex: 1,
        marginTop: -30,
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 24,
        paddingHorizontal: wp(5),
    },
    infoSection: {
        marginBottom: 24,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    coachName: {
        fontSize: fontScale(24),
        fontWeight: 'bold',
        color: '#FFF',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    coachSport: {
        color: colors.text.secondary,
        fontSize: fontScale(14),
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    bioText: {
        color: '#CCC',
        fontSize: fontScale(14),
        lineHeight: 22,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    tagText: {
        color: '#CCC',
        fontSize: 12,
    },
    venueOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    selectedVenue: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(57, 224, 121, 0.05)',
    },
    venueInfo: {
        flex: 1,
    },
    venueName: {
        color: '#FFF',
        fontSize: fontScale(14),
        fontWeight: 'bold',
        marginBottom: 2,
    },
    venueLocation: {
        color: '#888',
        fontSize: 12,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1E',
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: 16,
        paddingBottom: hp(4), // For bottom safe area
    },
    priceLabel: {
        color: '#888',
        fontSize: 12,
    },
    priceValue: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    priceUnit: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#888',
    },
});

export default CoachDetailsScreen;
