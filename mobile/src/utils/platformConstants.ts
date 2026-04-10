// Polyfill pour PlatformConstants - évite l'erreur TurboModuleRegistry
import { Platform } from 'react-native';

export const PlatformConstants = {
  getConstants: () => ({
    osVersion: Platform.Version ? Platform.Version.toString() : '0',
    uiMode: 'normal',
    forceTouchAvailable: false,
    interfaceIdiom: 'handset',
  }),
  
  // Properties requises par Expo
  osVersion: Platform.Version ? Platform.Version.toString() : '0',
  uiMode: 'normal',
  forceTouchAvailable: false,
  interfaceIdiom: 'handset',
  reactNativeVersion: {
    major: 0,
    minor: 71,
    patch: 11,
    prerelease: null,
  },
  isTesting: false,
  isDebuggingNewArchEnabled: false,
};

export default PlatformConstants;
