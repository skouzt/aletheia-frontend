const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb', 'gltf', 'spline', 'splinecode');
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs');
config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, { input: './global.css' });
