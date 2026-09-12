import { ThemeProvider } from '@/components/ThemeProvider';
import { AdminSignInPage } from '@/pages/AdminSignInPage';

export function App() {
  return (
    <ThemeProvider defaultTheme='system'>
      <AdminSignInPage />
    </ThemeProvider>
  );
}
