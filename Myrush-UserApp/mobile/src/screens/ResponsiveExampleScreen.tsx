import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { moderateScale, fontScale, wp, hp } from '../utils/responsive';

/**
 * Example screen demonstrating responsive design best practices
 * This screen adapts to all iOS and Android devices automatically
 */
const ResponsiveExampleScreen = () => {
    const {
        isTablet,
        isPortrait,
        isLandscape,
        breakpoint,
        deviceType,
        screenWidth,
        screenHeight,
        statusBarHeight,
        hasNotch,
        spacing,
        borderRadius,
        iconSize,
        rs,
        rv,
    } = useResponsive();

    // Example: Grid columns based on device size
    const gridColumns = rv({
        xsmall: 1,
        small: 2,
        medium: 2,
        large: 3,
        xlarge: 3,
        tablet: 4,
        default: 2,
    });

    // Example: Card size based on device
    const cardWidth = isTablet
        ? wp(100 / gridColumns) - spacing.lg()
        : wp(90);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: spacing.lg(),
                }}
            >
                {/* Header */}
                <View style={[styles.header, { marginBottom: spacing.xl() }]}>
                    <Text style={[styles.title, { fontSize: fontScale(24) }]}>
                        Responsive Design Demo
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: fontScale(14) }]}>
                        Adapts to all devices automatically
                    </Text>
                </View>

                {/* Device Info Card */}
                <View
                    style={[
                        styles.card,
                        {
                            padding: spacing.lg(),
                            borderRadius: borderRadius.xl(),
                            marginBottom: spacing.xl(),
                        },
                    ]}
                >
                    <Text style={[styles.cardTitle, { fontSize: fontScale(18), marginBottom: spacing.md() }]}>
                        Device Information
                    </Text>

                    <InfoRow icon="phone-portrait-outline" label="Device Type" value={deviceType} />
                    <InfoRow icon="grid-outline" label="Breakpoint" value={breakpoint} />
                    <InfoRow icon="resize-outline" label="Screen Size" value={`${screenWidth}×${screenHeight}px`} />
                    <InfoRow icon="phone-portrait-outline" label="Orientation" value={isPortrait ? 'Portrait' : 'Landscape'} />
                    <InfoRow icon="tablet-portrait-outline" label="Is Tablet" value={isTablet ? 'Yes' : 'No'} />
                    <InfoRow icon="cut-outline" label="Has Notch" value={hasNotch ? 'Yes' : 'No'} />
                    <InfoRow icon="bar-chart-outline" label="Status Bar Height" value={`${statusBarHeight}px`} />
                </View>

                {/* Responsive Grid Example */}
                <View style={{ marginBottom: spacing.xl() }}>
                    <Text style={[styles.sectionTitle, { fontSize: fontScale(18), marginBottom: spacing.md() }]}>
                        Responsive Grid ({gridColumns} columns)
                    </Text>

                    <View style={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.gridItem,
                                    {
                                        width: isTablet ? `${100 / gridColumns - 2}%` : wp(42),
                                        padding: spacing.md(),
                                        borderRadius: borderRadius.lg(),
                                        marginBottom: spacing.md(),
                                    },
                                ]}
                            >
                                <Ionicons name="cube-outline" size={iconSize.xl()} color="#2196F3" />
                                <Text style={[styles.gridItemText, { fontSize: fontScale(14), marginTop: spacing.xs() }]}>
                                    Item {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Responsive Sizing Example */}
                <View style={{ marginBottom: spacing.xl() }}>
                    <Text style={[styles.sectionTitle, { fontSize: fontScale(18), marginBottom: spacing.md() }]}>
                        Responsive Sizing (rs helper)
                    </Text>

                    <View
                        style={[
                            styles.card,
                            {
                                padding: spacing.lg(),
                                borderRadius: borderRadius.xl(),
                            },
                        ]}
                    >
                        <Text style={{
                            fontSize: rs(12, 14, 16, 18, 20, 22),
                            color: '#333',
                            marginBottom: spacing.sm(),
                        }}>
                            This text scales: {rs(12, 14, 16, 18, 20, 22)}px
                        </Text>
                        <Text style={{ fontSize: fontScale(12), color: '#666' }}>
                            Font size adjusts automatically based on breakpoint
                        </Text>
                    </View>
                </View>

                {/* Orientation-Specific Layout */}
                <View style={{ marginBottom: spacing.xl() }}>
                    <Text style={[styles.sectionTitle, { fontSize: fontScale(18), marginBottom: spacing.md() }]}>
                        Orientation Adaptive Layout
                    </Text>

                    <View
                        style={[
                            styles.orientationContainer,
                            {
                                flexDirection: isPortrait ? 'column' : 'row',
                                padding: spacing.lg(),
                                borderRadius: borderRadius.xl(),
                            },
                        ]}
                    >
                        <View style={[
                            styles.orientationBox,
                            {
                                width: isPortrait ? '100%' : '48%',
                                padding: spacing.md(),
                                borderRadius: borderRadius.md(),
                                marginBottom: isPortrait ? spacing.md() : 0,
                            },
                        ]}>
                            <Text style={{ fontSize: fontScale(14), color: '#fff', textAlign: 'center' }}>
                                Box 1
                            </Text>
                        </View>
                        <View style={[
                            styles.orientationBox,
                            {
                                width: isPortrait ? '100%' : '48%',
                                padding: spacing.md(),
                                borderRadius: borderRadius.md(),
                            },
                        ]}>
                            <Text style={{ fontSize: fontScale(14), color: '#fff', textAlign: 'center' }}>
                                Box 2
                            </Text>
                        </View>
                    </View>

                    <Text style={[
                        styles.hint,
                        {
                            fontSize: fontScale(12),
                            marginTop: spacing.sm(),
                            textAlign: 'center',
                        },
                    ]}>
                        {isPortrait ? 'Stacked vertically in portrait' : 'Side by side in landscape'}
                    </Text>
                </View>

                {/* Tablet-Specific Layout */}
                {isTablet && (
                    <View style={{ marginBottom: spacing.xl() }}>
                        <Text style={[styles.sectionTitle, { fontSize: fontScale(18), marginBottom: spacing.md() }]}>
                            Tablet-Only Section
                        </Text>

                        <View
                            style={[
                                styles.card,
                                {
                                    padding: spacing.xl(),
                                    borderRadius: borderRadius.xl(),
                                    backgroundColor: '#E3F2FD',
                                },
                            ]}
                        >
                            <Ionicons name="tablet-portrait-outline" size={iconSize.xxl()} color="#2196F3" />
                            <Text style={{ fontSize: fontScale(16), color: '#1976D2', marginTop: spacing.md() }}>
                                This section only appears on tablets!
                            </Text>
                            <Text style={{ fontSize: fontScale(14), color: '#1976D2', marginTop: spacing.sm() }}>
                                Use this pattern to show tablet-optimized content.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Spacing Examples */}
                <View style={{ marginBottom: spacing.xl() }}>
                    <Text style={[styles.sectionTitle, { fontSize: fontScale(18), marginBottom: spacing.md() }]}>
                        Responsive Spacing Scale
                    </Text>

                    {['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'].map((size) => (
                        <View
                            key={size}
                            style={[
                                styles.spacingExample,
                                {
                                    padding: spacing.sm(),
                                    borderRadius: borderRadius.sm(),
                                    marginBottom: spacing.xs(),
                                },
                            ]}
                        >
                            <View
                                style={{
                                    height: moderateScale(20),
                                    // @ts-ignore
                                    width: spacing[size](),
                                    backgroundColor: '#4CAF50',
                                    borderRadius: borderRadius.xs(),
                                }}
                            />
                            <Text style={[styles.spacingLabel, { fontSize: fontScale(12), marginLeft: spacing.sm() }]}>
                                {/* @ts-ignore */}
                                {size}: {spacing[size]()}px
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Bottom padding for safe navigation */}
                <View style={{ height: hp(5) }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => {
    const { spacing, iconSize } = useResponsive();

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm(),
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
            }}
        >
            <Ionicons name={icon} size={iconSize.md()} color="#2196F3" />
            <Text style={{
                flex: 1,
                fontSize: fontScale(14),
                color: '#666',
                marginLeft: spacing.sm(),
            }}>
                {label}
            </Text>
            <Text style={{ fontSize: fontScale(14), color: '#333', fontWeight: '600' }}>
                {value}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        alignItems: 'center',
    },
    title: {
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontWeight: '600',
        color: '#333',
    },
    sectionTitle: {
        fontWeight: '700',
        color: '#333',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    gridItemText: {
        color: '#333',
        fontWeight: '500',
    },
    orientationContainer: {
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orientationBox: {
        backgroundColor: '#2196F3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hint: {
        color: '#666',
        fontStyle: 'italic',
    },
    spacingExample: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
    },
    spacingLabel: {
        color: '#333',
        fontWeight: '500',
    },
});

export default ResponsiveExampleScreen;
