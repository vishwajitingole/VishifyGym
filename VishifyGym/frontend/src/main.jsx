import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { GymProvider } from './state/GymContext';
import './styles.css';

registerSW({ immediate: true });
createRoot(document.getElementById('root')).render(<React.StrictMode><GymProvider><App /></GymProvider></React.StrictMode>);
