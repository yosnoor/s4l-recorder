const { execSync } = require("child_process");
const fs = require("fs");

fs.writeFileSync(
  "test-render.test.tsx",
  `
import React from 'react';
import { render } from '@testing-library/react-native';
import { View, TextInput } from 'react-native';

test('simple render', () => {
  const { getByPlaceholderText } = render(<View><TextInput placeholder="test" /></View>);
  expect(getByPlaceholderText('test')).toBeTruthy();
});
`,
);

try {
  execSync("npx jest test-render.test.tsx", { stdio: "inherit" });
} catch (e) {
  //
}
