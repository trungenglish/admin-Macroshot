import { ThemeProvider } from '@/components/ThemeProvider';

export const App = () => {
  return (
    <ThemeProvider defaultTheme='dark'>
      <div>Hello World</div>
    </ThemeProvider>
  );
};
