import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/AppSidebar';

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider open={false}>
        <AppSideBar />

        <SidebarInset></SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};
