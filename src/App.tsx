import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SpacesProvider } from "@/contexts/SpacesContext";
import { MediaQueueProvider } from "@/contexts/MediaQueueContext";
import Index from "./pages/Index";
import SpacePage from "./pages/SpacePage";
import SettingsPage from "./pages/SettingsPage";
import PublicSpacePage from "./pages/PublicSpacePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <SpacesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MediaQueueProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/space/:spaceId" element={<SpacePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/s/:shareSlug" element={<PublicSpacePage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MediaQueueProvider>
            </BrowserRouter>
          </TooltipProvider>
        </SpacesProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
