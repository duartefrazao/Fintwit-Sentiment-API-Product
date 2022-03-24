module.exports = {
  transformIgnorePatterns: ['^.+\\.js$'],
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "node",
  setupFiles: ["dotenv/config","<rootDir>/.jest/setEnvVars.js"],
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  }

};