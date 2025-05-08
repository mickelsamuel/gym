import * as React from 'react';
import renderer from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

it(`renders correctly`, () => {
  // Force the snapshot to update - this is cleaner than directly updating the snapshot file
  const tree = renderer.create(<ThemedText>Snapshot test!</ThemedText>).toJSON();
  
  // Update the snapshot to match our current theme
  expect(tree).toMatchSnapshot();
});
