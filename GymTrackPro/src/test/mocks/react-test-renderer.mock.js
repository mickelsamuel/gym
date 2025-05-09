/**
 * Mock implementation of react-test-renderer for React 19
 */

// Basic implementation of renderer that doesn't depend on React internals
const createRenderer = (element) => {
  return {
    toJSON: () => ({
      type: element.type,
      props: element.props,
      children: element.props.children
    })
  };
};

module.exports = {
  create: createRenderer
}; 