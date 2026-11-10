import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import SharedBookingsApp from './SharedBookingsApp.tsx';
import { isAdminHost } from './lib/isAdminHost';
import { shouldMountSharedBookingsPortal } from './lib/sharedBookingsPortal';
import './index.css';

function pickRoot() {
  if (isAdminHost()) return AdminApp
  if (shouldMountSharedBookingsPortal()) return SharedBookingsApp
  return App
}

const Root = pickRoot()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
