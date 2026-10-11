import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { installAuthExpiryInterceptor } from '@/app/auth-expiry-interceptor';
import { AppProviders } from '@/app/providers';
import '@/index.css';

installAuthExpiryInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
