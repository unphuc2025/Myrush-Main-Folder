import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MOCK_CHATS = [
    { id: '1', user: 'Alex Johnson', message: 'See you at the game!', time: '2m ago', unread: 2 },
    { id: '2', user: 'Raging Bulls Team', message: 'Practice cancelled today.', time: '1h ago', unread: 0 },
    { id: '3', user: 'Sarah Lee', message: 'Great game yesterday!', time: 'Yesterday', unread: 0 },
    { id: '4', user: 'Mike Brown', message: 'Are you joining the tournament?', time: '2d ago', unread: 0 },
];

const ChatListScreen = () => {
    const navigation = useNavigation<any>();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, userName: item.user })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user[0]}</Text>
            </View>
            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.userName}>{item.user}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
                <View style={styles.messageRow}>
                    <Text style={[styles.message, item.unread > 0 && styles.unreadMessage]} numberOfLines={1}>
                        {item.message}
                    </Text>
                    {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity>
                    <Ionicons name="create-outline" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={MOCK_CHATS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
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
        fontSize: fontScale(20),
        fontWeight: 'bold',
        color: '#FFF',
    },
    listContent: {
        paddingBottom: hp(5),
    },
    chatItem: {
        flexDirection: 'row',
        padding: wp(4),
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
        alignItems: 'center',
    },
    avatar: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    avatarText: {
        fontSize: fontScale(18),
        fontWeight: 'bold',
        color: colors.primary,
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    userName: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#FFF',
    },
    time: {
        fontSize: fontScale(12),
        color: '#666',
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    message: {
        fontSize: fontScale(14),
        color: '#888',
        flex: 1,
        marginRight: wp(2),
    },
    unreadMessage: {
        color: '#FFF',
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: colors.primary,
        width: moderateScale(20),
        height: moderateScale(20),
        borderRadius: moderateScale(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        fontSize: fontScale(10),
        fontWeight: 'bold',
        color: '#000',
    },
});

export default ChatListScreen;
