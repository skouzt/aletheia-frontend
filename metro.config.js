const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// ✅ Add extra asset extensions (3D / spline)
config.resolver.assetExts.push(
  'glb',
  'gltf',
  'spline',
  'splinecode'
);

// ✅ Ensure all source extensions are supported
config.resolver.sourceExts.push(
  'jsx',
  'js',
  'ts',
  'tsx',
  'cjs',
  'mjs',
  'css'
);

// ✅ Wrap with NativeWind
module.exports = withNativeWind(config, {
  input: './global.css',
});
