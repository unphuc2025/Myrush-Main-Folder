import { registerRootComponent } from 'expo';

import App from './App';

// Firebase background handler removed for Expo Go compatibility
// To enable push notifications, use expo-notifications or build a custom development build

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
