const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Fix for @react-native-community/netinfo bundling error.
 * The package's package.json points the "react-native" field to its TS source (src/index.ts),
 * which Metro tries to resolve but fails on internal TS imports.
 * This resolver override forces Metro to use the compiled CommonJS output instead.
 */
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@react-native-community/netinfo') {
        return {
            filePath: path.resolve(
                __dirname,
                'node_modules/@react-native-community/netinfo/lib/commonjs/index.js'
            ),
            type: 'sourceFile',
        };
    }

    // Fall back to default resolver for everything else
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;