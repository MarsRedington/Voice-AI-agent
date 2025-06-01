/* eslint-disable @typescript-eslint/no-require-imports */
// jest.config.js
//import nextJest from "next/jest"
// const nextJest = require("next/jest");


// const createJestConfig = nextJest({
//   dir: "./",
// })

// const customJestConfig = {
//   testEnvironment: "jsdom", 
//   setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
//   moduleNameMapper: {
//     "^@/(.*)$": "<rootDir>/src/$1",
//   },
//   transform: {
//     "^.+\\.(ts|tsx)$": "babel-jest",
//   },
//   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
// }

// export default createJestConfig(customJestConfig)

// jest.config.cjs
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

module.exports = createJestConfig(customJestConfig);
