import React, { useState, useRef } from 'react';
import {
    View,
    FlatList,
    Image,
    Dimensions,
    StyleSheet,
    Animated,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { getImageUrl } from '../../config/env';
import { wp, hp, moderateScale } from '../../utils/responsive';

import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface PhotoGalleryProps {
    photos: string[];
    defaultImage?: any;
    height?: number;
}

interface GalleryItemProps {
    item: string;
    defaultImage?: any;
    height: number;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ item, defaultImage, height }) => {
    const uri = item ? getImageUrl(item) : null;
    const [imageError, setImageError] = useState(false);

    if (!uri || imageError) {
        return (
            <View style={[styles.imageContainer, { height, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' }]}>
                {defaultImage ? (
                    <Image source={defaultImage} style={styles.image} resizeMode="cover" />
                ) : (
                    <Ionicons name="image-outline" size={moderateScale(48)} color="#333" />
                )}
            </View>
        );
    }

    return (
        <View style={[styles.imageContainer, { height }]}>
            <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
                onError={() => {
                    console.log('[PHOTO GALLERY] Error loading image:', uri);
                    setImageError(true);
                }}
            />
        </View>
    );
};

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
    photos, 
    defaultImage,
    height = hp(45)
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

    if (!photos || photos.length === 0) {
        return (
            <GalleryItem item="" defaultImage={defaultImage} height={height} />
        );
    }

    return (
        <View style={{ height, zIndex: 1, overflow: 'visible' }}>
            <FlatList
                data={photos}
                renderItem={({ item }) => (
                    <GalleryItem item={item} defaultImage={defaultImage} height={height} />
                )}
                keyExtractor={(item, index) => `${item}-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false, listener: handleScroll }
                )}
                scrollEventThrottle={16}
            />
            
            {photos.length > 1 && (
                <View style={styles.pagination}>
                    {photos.map((_, index) => {
                        const opacity = scrollX.interpolate({
                            inputRange: [
                                (index - 1) * width,
                                index * width,
                                (index + 1) * width,
                            ],
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: 'clamp',
                        });
                        
                        const scale = scrollX.interpolate({
                            inputRange: [
                                (index - 1) * width,
                                index * width,
                                (index + 1) * width,
                            ],
                            outputRange: [0.8, 1.2, 0.8],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    { opacity, transform: [{ scale }] },
                                    activeIndex === index && styles.activeDot,
                                ]}
                            />
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        width: width,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: hp(12),
        alignSelf: 'center',
        zIndex: 50,
        elevation: 50,
        backgroundColor: 'rgba(0,0,0,0.2)', // Slight background to pop
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(20),
    },
    dot: {
        width: moderateScale(8),
        height: moderateScale(8),
        borderRadius: moderateScale(4),
        backgroundColor: '#fff',
        marginHorizontal: moderateScale(4),
    },
    activeDot: {
        backgroundColor: '#39E079', // colors.primary fallback
    },
});

export default PhotoGallery;
