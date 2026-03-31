module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testPathIgnorePatterns: ['/node_modules/', '/android/'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|react-native|@react-navigation|' +
      'react-native-screens|react-native-safe-area-context|' +
      'react-native-vision-camera|react-native-fs|' +
      'react-native-get-random-values|' +
      '@credo-ts|@hyperledger|@openwallet-foundation' +
    ')/)',
  ],
  moduleNameMapper: {
    '@credo-ts/(.*)': '<rootDir>/__mocks__/@credo-ts/$1.js',
    '@hyperledger/(.*)': '<rootDir>/__mocks__/@hyperledger/$1.js',
    '@openwallet-foundation/(.*)': '<rootDir>/__mocks__/@openwallet-foundation/$1.js',
    'react-native-fs': '<rootDir>/__mocks__/react-native-fs.js',
    'react-native-vision-camera': '<rootDir>/__mocks__/react-native-vision-camera.js',
  },
  setupFiles: ['./jest.setup.js'],
}
