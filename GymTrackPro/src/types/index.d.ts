// Declare missing module types to fix TypeScript errors

declare module '@babel/template' {
  const content: any;
  export default content;
}

declare module 'hammerjs' {
  const Hammer: any;
  export default Hammer;
}

// Add any other module declarations as needed 