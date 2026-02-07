import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fontScale, moderateScale, wp, hp } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const MOCK_MESSAGES = [
    { id: '1', text: 'Hey! Are you coming to the game tonight?', sender: 'them', time: '10:30 AM' },
    { id: '2', text: 'Yes, looking forward to it!', sender: 'me', time: '10:32 AM' },
    { id: '3', text: 'Awesome. See you there.', sender: 'them', time: '10:33 AM' },
];

const ChatDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { userName } = route.params || { userName: 'Chat' };
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'me',
            time: 'Now',
        };
        setMessages([...messages, newMessage]);
        setInputText('');
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                        {item.time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>{userName[0]}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{userName}</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={moderateScale(24)} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={moderateScale(20)} color="#000" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#1C1C1E' }} />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
        backgroundColor: colors.background.primary,
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: wp(3),
    },
    headerAvatar: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerAvatarText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: fontScale(16),
        fontWeight: 'bold',
        color: '#FFF',
    },
    listContent: {
        padding: wp(4),
        gap: hp(1.5),
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    theirMessageRow: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: moderateScale(16),
    },
    myBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 2,
    },
    theirBubble: {
        backgroundColor: '#1C1C1E',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: fontScale(15),
        lineHeight: fontScale(20),
    },
    myMessageText: {
        color: '#000',
    },
    theirMessageText: {
        color: '#FFF',
    },
    messageTime: {
        fontSize: fontScale(10),
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(0,0,0,0.6)',
    },
    theirMessageTime: {
        color: 'rgba(255,255,255,0.4)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        backgroundColor: '#1C1C1E',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    input: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        borderRadius: moderateScale(20),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        maxHeight: hp(12),
        color: '#FFF',
        fontSize: fontScale(15),
        marginRight: wp(3),
    },
    sendButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatDetailScreen;
