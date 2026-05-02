import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import React from 'react';

// The App.js file serves as the core entry point for the MediCore mobile application.
// While Expo Router typically handles the entry automatically, this file provides
// a centralized location for low-level application registration and context configuration.

export function App() {
  // require.context is a Webpack/Metro feature used by Expo Router to 
  // dynamically discover routes within the 'app' directory.
  const context = require.context('./app');

  return <ExpoRoot context={context} />;
}

// registerRootComponent ensures that the 'App' component is registered as the 
// main entry point of the application, compatible with both Expo Go and native builds.
registerRootComponent(App);
