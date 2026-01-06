import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
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
    // const [location, setLocation] = useState(''); // Replaced
    const [format, setFormat] = useState('Knockout');
    const [rules, setRules] = useState('');
    const [entryFee, setEntryFee] = useState('');

    // Date picker modal states
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

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
    const [showCodeDropdown, setShowCodeDropdown] = useState(false); // Code/Coach dropdown

    const formats = ['Knockout', 'League', 'Round Robin', 'Group + Knockout'];

    // 1. Fetch Game Types (Independent of City)
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
    }, []);

    // 2. Fetch User Profile to get City
    useEffect(() => {
        const fetchProfile = async () => {
            setIsProfileLoading(true);
            try {
                const response = await profileApi.getProfile('');
                let city = '';

                if (response.success && response.data?.city) {
                    city = response.data.city;
                } else {
                    // Fallback to auth store city or default
                    city = (user as any)?.city || 'Hyderabad';
                    console.log('Using fallback city:', city);
                }

                setUserCity(city);
                fetchCourts(city);

            } catch (error) {
                console.error('Error fetching profile:', error);
                const fallbackCity = (user as any)?.city || 'Hyderabad';
                setUserCity(fallbackCity);
                fetchCourts(fallbackCity);
            } finally {
                setIsProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // 3. Fetch Courts for City (Used for filtering branches/codes)
    const fetchCourts = async (city: string) => {
        setIsLoading(true);
        try {
            // Fetch all courts for the city
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

    // 4. Update Branches when Sport or AllCourts change
    useEffect(() => {
        if (selectedSport && allCourts.length > 0) {
            // Filter courts by game type (Sport)
            const sportCourts = allCourts.filter(court =>
                court.game_type?.toLowerCase() === selectedSport.toLowerCase()
            );

            // Extract unique branches
            const uniqueBranches = Array.from(new Set(sportCourts.map(c => c.branch_name || 'Unknown Branch').filter(b => b !== 'Unknown Branch')));
            setBranches(uniqueBranches);

            // Reset selections if they are no longer valid
            if (selectedBranch && !uniqueBranches.includes(selectedBranch)) {
                setSelectedBranch('');
                setSelectedCourt(null);
            }
        } else {
            setBranches([]);
        }
    }, [selectedSport, allCourts]);

    // 5. Update Filtered Courts (Codes) when Branch or Sport changes
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

    // Date formatting function
    const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    // Date picker handlers
    const handleStartDateConfirm = (date: Date) => {
        const formattedDate = formatDate(date);
        setStartDate(formattedDate);
        setStartDatePickerVisible(false);
    };

    const handleEndDateConfirm = (date: Date) => {
        const formattedDate = formatDate(date);
        setEndDate(formattedDate);
        setEndDatePickerVisible(false);
    };

    const hideStartDatePicker = () => {
        setStartDatePickerVisible(false);
    };

    const hideEndDatePicker = () => {
        setEndDatePickerVisible(false);
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
        } else {
            navigation.goBack();
        }
    };

    const handleContinue = () => {
        if (step === 1) {
            // Basic validation
            if (!tournamentName.trim()) {
                alert('Please enter a tournament name');
                return;
            }
            if (!selectedSport) {
                alert('Please select a sport');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            // Validate Step 2
            if (!selectedBranch) {
                alert('Please select a Branch');
                return;
            }
            if (!selectedCourt) {
                alert('Please select a Code (Court)');
                return;
            }
            if (!startDate.trim()) {
                alert('Please enter a start date');
                return;
            }
            if (!endDate.trim()) {
                alert('Please enter an end date');
                return;
            }
            if (!startTime.trim()) {
                alert('Please enter a start time');
                return;
            }
            if (!endTime.trim()) {
                alert('Please enter an end time');
                return;
            }
            setStep(3);
        } else {
            // Step 3: Create Tournament
            // Submit logic would go here
            console.log('Creating Tournament:', {
                tournamentName,
                selectedSport,
                visibility,
                startDate,
                endDate,
                branch: selectedBranch,
                code: selectedCourt!.court_name, // Using court name as Code
                courtId: selectedCourt!.id,
                format,
                rules,
                entryFee
            });
            alert('Tournament Created Successfully!');
            navigation.goBack();
        }
    };

    const renderStep1 = () => (
        <View style={styles.formContainer}>
            {/* Tournament Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Tournament Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter tournament name"
                    placeholderTextColor="#9CA3AF"
                    value={tournamentName}
                    onChangeText={setTournamentName}
                />
            </View>

            {/* Sport Type (Fetched from Admin Table) */}
            <View style={[styles.inputGroup, { zIndex: 10 }]}>
                <Text style={styles.label}>Sport Type</Text>
                {/* 
                   Display Logic:
                   - If loading game types, show loading.
                   - If availableSports empty, show "No sports".
                */}
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowSportDropdown(!showSportDropdown)}
                >
                    <Text style={[styles.dropdownText, !selectedSport && styles.placeholderText]}>
                        {selectedSport || (availableSports.length > 0 ? 'Select a sport' : 'Loading sports...')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                {showSportDropdown && (
                    <View style={styles.dropdownList}>
                        {availableSports.length > 0 ? (
                            availableSports.map((sport) => (
                                <TouchableOpacity
                                    key={sport}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSelectedSport(sport);
                                        setShowSportDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{sport}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.dropdownItem}>
                                <Text style={styles.dropdownItemText}>No sports found</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Visibility */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Visibility</Text>
                <View style={styles.visibilityContainer}>
                    <TouchableOpacity
                        style={[styles.visibilityOption, visibility === 'Public' && styles.visibilityActive]}
                        onPress={() => setVisibility('Public')}
                    >
                        <Text style={[styles.visibilityText, visibility === 'Public' && styles.visibilityTextActive]}>Public</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.visibilityOption, visibility === 'Private' && styles.visibilityActive]}
                        onPress={() => setVisibility('Private')}
                    >
                        <Text style={[styles.visibilityText, visibility === 'Private' && styles.visibilityTextActive]}>Private</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.formContainer}>
            {/* Tournament Name (Read Only or Editable) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Tournament Name</Text>
                <TextInput
                    style={styles.input}
                    value={tournamentName}
                    onChangeText={setTournamentName}
                    placeholder="e.g., Summer Padel Open"
                    editable={false} // Make read-only in step 2 usually
                />
            </View>

            {/* Dates Row */}
            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: wp(2) }]}>
                    <Text style={styles.label}>Start Date</Text>
                    <View style={styles.dateInputContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.inputWithIcon]}
                            placeholder="DD MMM YYYY"
                            placeholderTextColor="#9CA3AF"
                            value={startDate}
                            onChangeText={(text) => {
                                setStartDate(text);
                                // Auto-format as user types
                                if (text.length === 2 && !text.includes(' ')) {
                                    setStartDate(text + ' ');
                                } else if (text.length === 6 && text.split(' ').length === 2) {
                                    setStartDate(text + ' ');
                                }
                            }}
                        />
                    </View>
                    <Text style={styles.hintText}>Example: 25 Dec 2025</Text>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: wp(2) }]}>
                    <Text style={styles.label}>End Date</Text>
                    <View style={styles.dateInputContainer}>
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.inputWithIcon]}
                            placeholder="DD MMM YYYY"
                            placeholderTextColor="#9CA3AF"
                            value={endDate}
                            onChangeText={(text) => {
                                setEndDate(text);
                                // Auto-format as user types
                                if (text.length === 2 && !text.includes(' ')) {
                                    setEndDate(text + ' ');
                                } else if (text.length === 6 && text.split(' ').length === 2) {
                                    setEndDate(text + ' ');
                                }
                            }}
                        />
                    </View>
                    <Text style={styles.hintText}>Example: 30 Dec 2025</Text>
                </View>
            </View>

            {/* Times Row */}
            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: wp(2) }]}>
                    <Text style={styles.label}>Start Time</Text>
                    <View style={styles.dateInputContainer}>
                        <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.inputWithIcon]}
                            placeholder="HH:MM"
                            placeholderTextColor="#9CA3AF"
                            value={startTime}
                            onChangeText={(text) => {
                                setStartTime(text);
                                // Auto-format as user types (HH:MM)
                                if (text.length === 2 && !text.includes(':')) {
                                    setStartTime(text + ':');
                                }
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                        />
                    </View>
                    <Text style={styles.hintText}>Example: 09:00</Text>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: wp(2) }]}>
                    <Text style={styles.label}>End Time</Text>
                    <View style={styles.dateInputContainer}>
                        <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.inputWithIcon]}
                            placeholder="HH:MM"
                            placeholderTextColor="#9CA3AF"
                            value={endTime}
                            onChangeText={(text) => {
                                setEndTime(text);
                                // Auto-format as user types (HH:MM)
                                if (text.length === 2 && !text.includes(':')) {
                                    setEndTime(text + ':');
                                }
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                        />
                    </View>
                    <Text style={styles.hintText}>Example: 17:00</Text>
                </View>
            </View>

            {/* Branch Dropdown */}
            <View style={[styles.inputGroup, { zIndex: 20 }]}>
                <Text style={styles.label}>Branch</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowBranchDropdown(!showBranchDropdown)}
                >
                    <Text style={[styles.dropdownText, !selectedBranch && styles.placeholderText]}>
                        {selectedBranch || (branches.length > 0 ? 'Select Valid Branch' : (allCourts.length === 0 ? `No venues in ${userCity}` : 'Select Sport first'))}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                {showBranchDropdown && (
                    <View style={styles.dropdownList}>
                        {branches.length > 0 ? (
                            branches.map((branch) => (
                                <TouchableOpacity
                                    key={branch}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSelectedBranch(branch);
                                        setShowBranchDropdown(false);
                                        // Reset court on branch change
                                        setSelectedCourt(null);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{branch}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.dropdownItem}>
                                <Text style={styles.dropdownItemText}>No branches available</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Code / Court Dropdown */}
            {selectedBranch && (
                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                    {/* Using 'Code' label as requested in flow details */}
                    <Text style={styles.label}>Code</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setShowCodeDropdown(!showCodeDropdown)}
                    >
                        <Text style={[styles.dropdownText, !selectedCourt && styles.placeholderText]}>
                            {selectedCourt?.court_name || 'Select Code'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    {showCodeDropdown && (
                        <View style={styles.dropdownList}>
                            {filteredCourts.length > 0 ? (
                                filteredCourts.map((court) => (
                                    <TouchableOpacity
                                        key={court.id}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setSelectedCourt(court);
                                            setShowCodeDropdown(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{court.court_name}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.dropdownItem}>
                                    <Text style={styles.dropdownItemText}>No codes available</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* Tournament Format */}
            <View style={[styles.inputGroup, { zIndex: 9 }]}>
                <Text style={styles.label}>Tournament Format</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowFormatDropdown(!showFormatDropdown)}
                >
                    <Text style={styles.dropdownText}>{format}</Text>
                    <Ionicons name="caret-down-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
                {showFormatDropdown && (
                    <View style={styles.dropdownList}>
                        {formats.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setFormat(item);
                                    setShowFormatDropdown(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Specific Rules */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Specific Rules</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., 3 sets per match, tie-break at 6-6..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={rules}
                    onChangeText={setRules}
                />
            </View>

            {/* Entry Fee */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Entry Fee</Text>
                <View style={styles.dateInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                        style={[styles.input, styles.inputWithCurrency]}
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={entryFee}
                        onChangeText={setEntryFee}
                    />
                </View>
            </View>

        </View>
    );

    const renderStep3 = () => (
        <View style={styles.formContainer}>
            {/* Tournament Summary Header */}
            <View style={styles.summaryHeader}>
                <Ionicons name="trophy-outline" size={24} color="#00C853" />
                <Text style={styles.summaryTitle}>Tournament Summary</Text>
                <Text style={styles.summarySubtitle}>Review your tournament details</Text>
            </View>

            {/* Tournament Details */}
            <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Name:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(1)}
                    >
                        <Text style={styles.summaryValue}>{tournamentName}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sport:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(1)}
                    >
                        <Text style={styles.summaryValue}>{selectedSport}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Visibility:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(1)}
                    >
                        <Text style={styles.summaryValue}>{visibility}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Schedule & Location */}
            <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Schedule & Location</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Start Date:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{startDate}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Start Time:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{startTime}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>End Date:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{endDate}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>End Time:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{endTime}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Branch:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{selectedBranch}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Court:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{selectedCourt?.court_name}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tournament Rules */}
            <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Tournament Details</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Format:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{format}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Entry Fee:</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>${entryFee || '0.00'}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Rules */}
            {rules.trim() && (
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Rules</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.summaryValue}>{rules}</Text>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Participants Section (Placeholder) */}
            <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Participants</Text>
                <Text style={styles.participantsText}>Participants will be able to join once the tournament is published.</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Tournament</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
            </ScrollView>



            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>
                        {step === 1 ? 'Continue' : step === 2 ? 'Review Tournament' : 'Publish Tournament'}
                    </Text>
                </TouchableOpacity>
            </View>


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: fontScale(20),
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: wp(5),
        paddingBottom: hp(10), // Extra padding for dropdowns at bottom
    },
    formContainer: {
        gap: hp(2.5),
    },
    inputGroup: {
        gap: hp(1),
        position: 'relative',
    },
    label: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#6B7280', // Grey label
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#9CA3AF', // Grey border
        borderRadius: moderateScale(8), // More rectangular
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: fontScale(16),
        color: '#1F2937',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    // Dropdown Styles
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6', // Light grey bg
        borderRadius: moderateScale(25), // Rounded pills for dropdowns in Step 1
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.8),
    },
    dropdownText: {
        fontSize: fontScale(16),
        color: '#1F2937',
        fontWeight: '500',
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 4,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 200,
        maxHeight: hp(25), // Scroll limit
    },
    dropdownItem: {
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(4),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: fontScale(16),
        color: '#374151',
    },

    // Visibility Toggle
    visibilityContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: moderateScale(30), // Pill shape
        padding: 4,
    },
    visibilityOption: {
        flex: 1,
        paddingVertical: hp(1.5),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: moderateScale(25),
    },
    visibilityActive: {
        backgroundColor: '#00C853', // Brand Green active
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    visibilityText: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#6B7280',
    },
    visibilityTextActive: {
        color: '#FFFFFF',
    },

    // Step 2 specific styles
    row: {
        flexDirection: 'row',
        marginBottom: hp(1),
    },
    dateInputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputWithIcon: {
        paddingLeft: wp(12),
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(4), // Shallower radius for Step 2 inputs to match image
        borderColor: '#6B7280',
    },
    inputIcon: {
        position: 'absolute',
        left: wp(3),
        zIndex: 1,
    },
    textArea: {
        height: hp(15),
        textAlignVertical: 'top',
        borderRadius: moderateScale(4),
    },
    currencySymbol: {
        position: 'absolute',
        left: wp(4),
        fontSize: fontScale(18),
        fontWeight: '700',
        color: '#111827',
        zIndex: 1,
    },
    inputWithCurrency: {
        paddingLeft: wp(8),
        borderRadius: moderateScale(4),
    },
    inputError: {
        borderColor: '#EF4444', // Red border for errors
    },
    errorText: {
        fontSize: fontScale(12),
        color: '#EF4444', // Red text for errors
        marginTop: hp(0.5),
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#9CA3AF',
        borderRadius: moderateScale(4),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
    },
    datePickerText: {
        fontSize: fontScale(16),
        color: '#1F2937',
        marginLeft: wp(2),
    },
    hintText: {
        fontSize: fontScale(12),
        color: '#6B7280',
        marginTop: hp(0.5),
    },

    // Footer
    footer: {
        padding: wp(5),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    continueButton: {
        backgroundColor: '#00C853', // Brand Green
        paddingVertical: hp(2),
        borderRadius: moderateScale(30),
        alignItems: 'center',
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: fontScale(18),
        fontWeight: '700',
    },

    // Summary Screen Styles
    summaryHeader: {
        alignItems: 'center',
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: hp(2),
    },
    summaryTitle: {
        fontSize: fontScale(24),
        fontWeight: '700',
        color: '#111827',
        marginTop: hp(1),
    },
    summarySubtitle: {
        fontSize: fontScale(14),
        color: '#6B7280',
        marginTop: hp(0.5),
    },
    summarySection: {
        backgroundColor: '#F9FAFB',
        borderRadius: moderateScale(12),
        padding: wp(4),
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: fontScale(18),
        fontWeight: '600',
        color: '#111827',
        marginBottom: hp(1.5),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: hp(1),
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    summaryLabel: {
        fontSize: fontScale(16),
        fontWeight: '500',
        color: '#6B7280',
        flex: 1,
    },
    summaryValue: {
        fontSize: fontScale(16),
        fontWeight: '600',
        color: '#111827',
        flex: 2,
        textAlign: 'right',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 2,
        justifyContent: 'flex-end',
    },
    participantsText: {
        fontSize: fontScale(14),
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: hp(1),
    },
});

export default CreateTournamentScreen;
