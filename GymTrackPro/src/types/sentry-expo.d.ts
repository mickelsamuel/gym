declare module 'sentry-expo' {
  export * from '@sentry/react-native';
  
  export enum Severity {
    Fatal = 'fatal',
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Debug = 'debug'
  }
} 