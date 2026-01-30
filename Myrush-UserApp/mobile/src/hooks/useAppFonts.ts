import { useFonts } from 'expo-font';
import {
    Lexend_100Thin,
    Lexend_200ExtraLight,
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black
} from '@expo-google-fonts/lexend';

export const useAppFonts = () => {
    const [fontsLoaded] = useFonts({
        'Lexend-Thin': Lexend_100Thin,
        'Lexend-ExtraLight': Lexend_200ExtraLight,
        'Lexend-Light': Lexend_300Light,
        'Lexend-Regular': Lexend_400Regular,
        'Lexend-Medium': Lexend_500Medium,
        'Lexend-SemiBold': Lexend_600SemiBold,
        'Lexend-Bold': Lexend_700Bold,
        'Lexend-ExtraBold': Lexend_800ExtraBold,
        'Lexend-Black': Lexend_900Black,
    });

    return fontsLoaded;
};
