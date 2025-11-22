import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SpacesProvider } from "@/contexts/SpacesContext";
import { MediaQueueProvider } from "@/contexts/MediaQueueContext";
import { InteractionProvider } from "@/contexts/InteractionContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import Index from "./pages/Index";
import SpacePage from "./pages/SpacePage";
import SettingsPage from "./pages/SettingsPage";
import PublicSpacePage from "./pages/PublicSpacePage";
import DefaultHomePage from "./pages/DefaultHomePage";
import HoloProfileDemo from "./pages/HoloProfileDemo";
import FOSPage from "./pages/FOSPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <InteractionProvider>
          <SpacesProvider>
            <SelectionProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <MediaQueueProvider>
                    <Routes>
                      <Route path="/" element={<FOSPage />} />
                      <Route path="/portal" element={<Index />} />
                      <Route path="/home" element={<DefaultHomePage />} />
                      <Route path="/space/:spaceId" element={<SpacePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/holo-profile" element={<HoloProfileDemo />} />
                      <Route path="/s/:shareSlug" element={<PublicSpacePage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MediaQueueProvider>
                </BrowserRouter>
              </TooltipProvider>
            </SelectionProvider>
          </SpacesProvider>
        </InteractionProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
