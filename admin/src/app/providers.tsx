import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { store } from '@/app/store';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme='system'>
        {children}
        <Toaster
          richColors
          closeButton
        />
      </ThemeProvider>
    </Provider>
  );
}
