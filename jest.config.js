module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist'],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
    "node_modules/variables/.+\\.(j|t)sx?$": "babel-jest"
  },
  testRegex: "(/src/.*\\.(test|spec))\\.(jsx?|tsx?|ts|js)$",
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|react-(native|universal|navigation)-(.*)|@react-native-community/(.*)|@react-navigation/(.*)|bs-platform|@rootstrap/redux-tools)"
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ]
}
