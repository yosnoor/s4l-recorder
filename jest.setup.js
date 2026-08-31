// React 19 requires this flag for act(...) to be recognised, which keeps state
// updates from async effects deterministic in tests.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/global.css", () => ({}));

// expo-crypto is a native module. Back it with Node's crypto so filename
// generation is exercised for real without a device build.
jest.mock("expo-crypto", () => ({
  randomUUID: () => require("crypto").randomUUID(),
}));
