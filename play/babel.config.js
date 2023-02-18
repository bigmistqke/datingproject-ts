module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    '@babel/plugin-transform-typescript',
  ],
  plugins: ['react-native-reanimated/plugin'],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
