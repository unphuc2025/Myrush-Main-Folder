import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LinearGradient } from 'expo-linear-gradient';

type HostGameRouteProp = RouteProp<RootStackParamList, 'HostGame'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const HostGameScreen = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<HostGameRouteProp>();
    const { bookingData } = route.params || {};

    const [gameTitle, setGameTitle] = useState(bookingData ? `${bookingData.venue_name} Match` : 'My Game');
    const [pricePerPerson, setPricePerPerson] = useState('150');
    const [skillLevel, setSkillLevel] = useState('Open');
    const [isPrivate, setIsPrivate] = useState(false);
    const [description, setDescription] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);

    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Open'];

    const handlePublish = () => {
        if (!gameTitle.trim()) {
            Alert.alert('Error', 'Please enter a game title');
            return;
        }

        setIsPublishing(true);
        // Simulate API call
        setTimeout(() => {
            setIsPublishing(false);
            Alert.alert(
                'Success',
                'Your game has been hosted successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('MainTabs', { screen: 'PlayTab' })
                    }
                ]
            );
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Host a Game</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Booking Summary Card */}
                <View style={styles.summaryCard}>
                    <LinearGradient
                        colors={['rgba(57, 224, 121, 0.1)', 'rgba(57, 224, 121, 0.02)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.summaryRow}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                        <Text style={styles.summaryText}>{bookingData?.venue_name || 'Venue Name'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Ionicons name="calendar" size={20} color={colors.primary} />
                        <Text style={styles.summaryText}>
                            {bookingData?.booking_date ? new Date(bookingData.booking_date).toDateString() : 'Date'} • {bookingData?.start_time ? bookingData.start_time.slice(0, 5) : 'Time'}
                        </Text>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <Input
                        label="Game Title"
                        value={gameTitle}
                        onChangeText={setGameTitle}
                        placeholder="e.g. Wednesday Night Padel"
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Skill Level</Text>
                        <View style={styles.pillsContainer}>
                            {skillLevels.map(level => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.pill,
                                        skillLevel === level && styles.pillActive
                                    ]}
                                    onPress={() => setSkillLevel(level)}
                                >
                                    <Text style={[
                                        styles.pillText,
                                        skillLevel === level && styles.pillTextActive
                                    ]}>{level}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Input
                        label="Price Per Person (₹)"
                        value={pricePerPerson}
                        onChangeText={setPricePerPerson}
                        keyboardType="numeric"
                        placeholder="150"
                    />

                    <Input
                        label="Description (Optional)"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Any special rules or instructions?"
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.switchLabel}>Private Game</Text>
                            <Text style={styles.switchSubLabel}>Only people with the link can join</Text>
                        </View>
                        <Switch
                            value={isPrivate}
                            onValueChange={setIsPrivate}
                            trackColor={{ false: '#333', true: colors.primary }}
                            thumbColor={isPrivate ? '#000' : '#f4f3f4'}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Publish Game"
                    onPress={handlePublish}
                    loading={isPublishing}
                    fullWidth
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    safeArea: {
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: fontScale(18),
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    content: {
        padding: wp(5),
        paddingBottom: hp(12),
    },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(57, 224, 121, 0.3)',
        overflow: 'hidden',
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryText: {
        color: '#FFF',
        fontSize: fontScale(14),
        fontWeight: '600',
    },
    formSection: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#AAA',
        fontSize: fontScale(14),
        marginBottom: 4,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#333',
    },
    pillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    pillText: {
        color: '#AAA',
        fontSize: fontScale(12),
        fontWeight: '600',
    },
    pillTextActive: {
        color: '#000',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    switchLabel: {
        color: '#FFF',
        fontSize: fontScale(16),
        fontWeight: '600',
    },
    switchSubLabel: {
        color: '#888',
        fontSize: fontScale(12),
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
    }
});

export default HostGameScreen;
