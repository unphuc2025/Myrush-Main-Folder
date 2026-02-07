import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CreateSquadScreen = () => {
    const navigation = useNavigation<any>();
    const [name, setName] = useState('');
    const [sport, setSport] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
        if (!name || !sport) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        Alert.alert('Success', 'Squad created successfully!', [
            { text: 'OK', onPress: () => navigation.replace('SquadDetails', { squadId: 'new' }) }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={moderateScale(28)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Squad</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Logo Upload Mock */}
                <TouchableOpacity style={styles.logoUpload}>
                    <Ionicons name="camera" size={moderateScale(32)} color={colors.primary} />
                    <Text style={styles.logoUploadText}>Add Team Logo</Text>
                </TouchableOpacity>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Squad Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Mumbai Smashers"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Sport *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Padel"
                        placeholderTextColor="#666"
                        value={sport}
                        onChangeText={setSport}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us about your squad..."
                        placeholderTextColor="#666"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <Text style={styles.note}>
                    * By creating a squad, you agree to our Community Guidelines.
                </Text>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                    <Text style={styles.createButtonText}>Create Squad</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        padding: wp(5),
    },
    logoUpload: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(50),
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: hp(4),
        borderWidth: 1,
        borderColor: '#333',
        borderStyle: 'dashed',
    },
    logoUploadText: {
        fontSize: fontScale(10),
        color: colors.primary,
        marginTop: 8,
    },
    formGroup: {
        marginBottom: hp(3),
    },
    label: {
        fontSize: fontScale(14),
        color: '#CCC',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#1C1C1E',
        borderRadius: moderateScale(12),
        padding: wp(4),
        color: '#FFF',
        fontSize: fontScale(16),
        borderWidth: 1,
        borderColor: '#333',
    },
    textArea: {
        height: hp(15),
    },
    note: {
        fontSize: fontScale(12),
        color: '#666',
        textAlign: 'center',
        marginTop: hp(2),
    },
    footer: {
        padding: wp(5),
        borderTopWidth: 1,
        borderTopColor: '#1C1C1E',
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingVertical: hp(2),
        borderRadius: moderateScale(12),
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#000',
    },
});

export default CreateSquadScreen;
