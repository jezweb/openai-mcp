module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'], // Test files will be in a 'test' directory
  moduleNameMapper: { // If needed to resolve module paths, e.g., if using path aliases
    '^axios$': require.resolve('axios'), // Ensures Jest uses the actual axios for unmocked parts if any
  },
};
