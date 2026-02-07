import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { venuesApi, Venue } from '../api/venues';
import { profileApi } from '../api/profile';
import { useAuthStore } from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';

type CreateTournamentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateTournament'>;

const CreateTournamentScreen = () => {
    const navigation = useNavigation<CreateTournamentNavigationProp>();
    const { user } = useAuthStore();

    // Step state: 1, 2, or 3
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    // Form State
    const [tournamentName, setTournamentName] = useState('');
    const [selectedSport, setSelectedSport] = useState('');
    const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [format, setFormat] = useState('Knockout');
    const [rules, setRules] = useState('');
    const [entryFee, setEntryFee] = useState('');

    // Data State
    const [userCity, setUserCity] = useState('');
    const [allCourts, setAllCourts] = useState<Venue[]>([]);

    // Derived/Selected Data State
    const [availableSports, setAvailableSports] = useState<string[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [filteredCourts, setFilteredCourts] = useState<Venue[]>([]);
    const [selectedCourt, setSelectedCourt] = useState<Venue | null>(null);

    // Dropdown Visibility States
    const [showSportDropdown, setShowSportDropdown] = useState(false);
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [showCodeDropdown, setShowCodeDropdown] = useState(false);

    const formats = ['Knockout', 'League', 'Round Robin', 'Group + Knockout'];

    useEffect(() => {
        const fetchGameTypes = async () => {
            try {
                const response = await venuesApi.getGameTypes();
                if (response.success && response.data) {
                    setAvailableSports(response.data);
                }
            } catch (error) {
                console.error('Error fetching game types:', error);
            }
        };
        fetchGameTypes();

        const fetchProfile = async () => {
            setIsProfileLoading(true);
            try {
                const response = await profileApi.getProfile('');
                let city = '';
                if (response.success && response.data?.city) {
                    city = response.data.city;
                } else {
                    city = (user as any)?.city || 'Hyderabad';
                }
                setUserCity(city);
                fetchCourts(city);
            } catch (error) {
                const fallbackCity = (user as any)?.city || 'Hyderabad';
                setUserCity(fallbackCity);
                fetchCourts(fallbackCity);
            } finally {
                setIsProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const fetchCourts = async (city: string) => {
        setIsLoading(true);
        try {
            const response = await venuesApi.getVenues({ city });
            if (response.success && response.data) {
                setAllCourts(response.data);
            }
        } catch (error) {
            console.error('Error fetching courts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSport && allCourts.length > 0) {
            const sportCourts = allCourts.filter(court =>
                court.game_type?.toLowerCase() === selectedSport.toLowerCase()
            );
            const uniqueBranches = Array.from(new Set(sportCourts.map(c => c.branch_name || 'Unknown Branch').filter(b => b !== 'Unknown Branch')));
            setBranches(uniqueBranches);
            if (selectedBranch && !uniqueBranches.includes(selectedBranch)) {
                setSelectedBranch('');
                setSelectedCourt(null);
            }
        } else {
            setBranches([]);
        }
    }, [selectedSport, allCourts]);

    useEffect(() => {
        if (selectedBranch && selectedSport && allCourts.length > 0) {
            const branchCourts = allCourts.filter(court =>
                court.branch_name === selectedBranch &&
                court.game_type?.toLowerCase() === selectedSport.toLowerCase()
            );
            setFilteredCourts(branchCourts);

            if (selectedCourt && !branchCourts.find(c => c.id === selectedCourt.id)) {
                setSelectedCourt(null);
            }
        } else {
            setFilteredCourts([]);
        }
    }, [selectedBranch, selectedSport, allCourts]);


    const handleBack = () => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
        else navigation.goBack();
    };

    const handleContinue = () => {
        if (step === 1) {
            if (!tournamentName.trim()) { alert('Please enter a tournament name'); return; }
            if (!selectedSport) { alert('Please select a sport'); return; }
            setStep(2);
        } else if (step === 2) {
            if (!selectedBranch) { alert('Please select a Branch'); return; }
            if (!selectedCourt) { alert('Please select a Code (Court)'); return; }
            if (!startDate.trim() || !endDate.trim()) { alert('Please check dates'); return; }
            setStep(3);
        } else {
            // Create
            console.log('Creating Tournament:', { tournamentName, selectedSport, visibility, startDate, endDate, branch: selectedBranch, code: selectedCourt?.court_name });
            alert('Tournament Created Successfully!');
            navigation.goBack();
        }
    };

    const ProgressBar = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3].map(s => (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                        <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
                    </View>
                    {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    const renderDropdown = (
        isVisible: boolean,
        setIsVisible: (v: boolean) => void,
        items: string[],
        onSelect: (item: string) => void,
        title: string
    ) => (
        <Modal visible={isVisible} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsVisible(false)}>
                <View style={styles.dropdownModal}>
                    <Text style={styles.dropdownTitle}>{title}</Text>
                    <ScrollView style={{ maxHeight: hp(40) }}>
                        {items.length > 0 ? items.map(item => (
                            <TouchableOpacity
                                key={item}
                                style={styles.dropdownModalItem}
                                onPress={() => onSelect(item)}
                            >
                                <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                        )) : (
                            <Text style={styles.noItemsText}>No items available</Text>
                        )}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Input
                label="Tournament Name"
                placeholder="e.g. Summer Open 2024"
                value={tournamentName}
                onChangeText={setTournamentName}
                containerStyle={styles.inputSpacing}
            />

            <View style={styles.inputSpacing}>
                <Text style={styles.label}>Sport Type</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowSportDropdown(true)}
                >
                    <Text style={[styles.dropdownValue, !selectedSport && styles.placeholderText]}>
                        {selectedSport || 'Select a sport'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {renderDropdown(
                    showSportDropdown,
                    setShowSportDropdown,
                    availableSports,
                    (item) => { setSelectedSport(item); setShowSportDropdown(false); },
                    "Select Sport"
                )}
            </View>

            <View style={styles.inputSpacing}>
                <Text style={styles.label}>Visibility</Text>
                <View style={styles.visibilityContainer}>
                    {['Public', 'Private'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.visibilityOption,
                                visibility === type && styles.visibilityOptionActive
                            ]}
                            onPress={() => setVisibility(type as any)}
                        >
                            <Text style={[
                                styles.visibilityText,
                                visibility === type && styles.visibilityTextActive
                            ]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.row}>
                <Input
                    label="Start Date"
                    placeholder="DD MMM"
                    value={startDate}
                    onChangeText={setStartDate}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                    leftIcon={<Ionicons name="calendar-outline" size={18} color="#666" />}
                />
                <Input
                    label="End Date"
                    placeholder="DD MMM"
                    value={endDate}
                    onChangeText={setEndDate}
                    containerStyle={{ flex: 1, marginLeft: 8 }}
                    leftIcon={<Ionicons name="calendar-outline" size={18} color="#666" />}
                />
            </View>

            <View style={styles.row}>
                <Input
                    label="Start Time"
                    placeholder="HH:MM"
                    value={startTime}
                    onChangeText={setStartTime}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                    maxLength={5}
                />
                <Input
                    label="End Time"
                    placeholder="HH:MM"
                    value={endTime}
                    onChangeText={setEndTime}
                    containerStyle={{ flex: 1, marginLeft: 8 }}
                    maxLength={5}
                />
            </View>

            <View style={styles.inputSpacing}>
                <Text style={styles.label}>Branch</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowBranchDropdown(true)}
                >
                    <Text style={[styles.dropdownValue, !selectedBranch && styles.placeholderText]}>
                        {selectedBranch || 'Select Branch'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {renderDropdown(
                    showBranchDropdown,
                    setShowBranchDropdown,
                    branches,
                    (item) => { setSelectedBranch(item); setShowBranchDropdown(false); setSelectedCourt(null); },
                    "Select Branch"
                )}
            </View>

            {selectedBranch && (
                <View style={styles.inputSpacing}>
                    <Text style={styles.label}>Code (Court)</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setShowCodeDropdown(true)}
                    >
                        <Text style={[styles.dropdownValue, !selectedCourt && styles.placeholderText]}>
                            {selectedCourt?.court_name || 'Select Court'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                    {renderDropdown(
                        showCodeDropdown,
                        setShowCodeDropdown,
                        filteredCourts.map(c => c.court_name),
                        (itemName) => {
                            const court = filteredCourts.find(c => c.court_name === itemName);
                            if (court) { setSelectedCourt(court); setShowCodeDropdown(false); }
                        },
                        "Select Court Code"
                    )}
                </View>
            )}

            <View style={styles.inputSpacing}>
                <Text style={styles.label}>Format</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowFormatDropdown(true)}
                >
                    <Text style={styles.dropdownValue}>{format}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {renderDropdown(showFormatDropdown, setShowFormatDropdown, formats, (f) => { setFormat(f); setShowFormatDropdown(false); }, "Select Format")}
            </View>

            <Input
                label="Entry Fee ($)"
                placeholder="0.00"
                value={entryFee}
                onChangeText={setEntryFee}
                keyboardType="numeric"
                containerStyle={styles.inputSpacing}
            />

            <Input
                label="Rules"
                placeholder="Specific rules..."
                value={rules}
                onChangeText={setRules}
                multiline
                numberOfLines={3}
                containerStyle={styles.inputSpacing}
                style={{ height: 80, textAlignVertical: 'top' }}
            />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons name="trophy" size={24} color={colors.primary} />
                    <Text style={styles.summaryTitle}>{tournamentName}</Text>
                    <Text style={styles.summaryBadge}>{visibility}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sport</Text>
                    <Text style={styles.summaryValue}>{selectedSport}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Format</Text>
                    <Text style={styles.summaryValue}>{format}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date</Text>
                    <Text style={styles.summaryValue}>{startDate} - {endDate}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Time</Text>
                    <Text style={styles.summaryValue}>{startTime} - {endTime}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fee</Text>
                    <Text style={[styles.summaryValue, { color: '#FF9F43' }]}>${entryFee || 'Free'}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryLoc}>
                    <Ionicons name="location" size={16} color={colors.text.secondary} />
                    <Text style={styles.summaryLocText}>{selectedBranch}, {selectedCourt?.court_name}</Text>
                </View>
            </View>

            <Text style={styles.termsText}>
                By publishing this tournament, you agree to the platform rules and hosting guidelines.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Tournament</Text>
                <View style={{ width: 24 }} />
            </View>

            <ProgressBar />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: hp(10) }}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title={step === 3 ? "Publish Tournament" : "Continue"}
                    onPress={handleContinue}
                    fullWidth
                    style={styles.continueBtn}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: fontScale(18),
        fontWeight: 'bold',
    },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: wp(10),
        marginBottom: hp(3),
        marginTop: hp(1),
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    stepCircleActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    stepNumber: {
        color: '#AAA',
        fontWeight: 'bold',
        fontSize: 12,
    },
    stepNumberActive: {
        color: '#000',
    },
    stepLine: {
        height: 2,
        backgroundColor: '#333',
        flex: 1,
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: colors.primary,
    },
    content: {
        flex: 1,
        paddingHorizontal: wp(5),
    },
    stepContainer: {
        gap: hp(1),
    },
    label: {
        color: '#AAA',
        marginBottom: 8,
        fontSize: 14,
    },
    inputSpacing: {
        marginBottom: hp(2.5),
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'transparent', // #333
        minHeight: 52,
    },
    dropdownValue: {
        color: '#FFF',
        fontSize: 16,
    },
    placeholderText: {
        color: '#666',
    },
    visibilityContainer: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 999,
        padding: 4,
    },
    visibilityOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 999,
    },
    visibilityOptionActive: {
        backgroundColor: '#333',
    },
    visibilityText: {
        color: '#666',
        fontWeight: '600',
    },
    visibilityTextActive: {
        color: '#FFF',
    },
    footer: {
        padding: wp(5),
        paddingBottom: hp(4),
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
        backgroundColor: '#000',
    },
    continueBtn: {
        backgroundColor: colors.primary,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: wp(5),
    },
    dropdownModal: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        maxHeight: hp(50),
        borderWidth: 1,
        borderColor: '#333',
    },
    dropdownTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    dropdownModalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    dropdownItemText: {
        color: '#DDD',
        fontSize: 16,
    },
    noItemsText: {
        color: '#666',
        textAlign: 'center',
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    summaryHeader: {
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    summaryTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    summaryBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        color: '#AAA',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        color: '#888',
        fontSize: 14,
    },
    summaryValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    summaryLoc: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    summaryLocText: {
        color: '#AAA',
        fontSize: 13,
    },
    termsText: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    }
});

export default CreateTournamentScreen;
