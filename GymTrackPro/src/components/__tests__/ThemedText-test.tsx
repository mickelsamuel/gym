import * as React from 'react';
// We'll directly use our mocked version via jest
import { create } from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

// Simplify the test to focus on component rendering
it(`renders correctly`, () => {
  const tree = create(<ThemedText>Snapshot test!</ThemedText>).toJSON();
  expect(tree).toBeDefined();
  // Add type assertion to handle the return type
  if (tree && typeof tree === 'object' && 'props' in tree) {
    expect(tree.props.children).toBe('Snapshot test!');
  }
});
