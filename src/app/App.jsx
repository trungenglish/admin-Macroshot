import AppRoutes from './router/AppRoutes.jsx';
import { QueryProvider } from './providers/QueryProvider.jsx';
import { ReduxProvider } from './providers/ReduxProvider.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';

function App() {
  return (
    <ReduxProvider>
      <QueryProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}

export default App;
