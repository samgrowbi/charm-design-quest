import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";

import BookLedCryo from "./pages/BookLedCryo";
import BookInstantLift from "./pages/BookInstantLift";
import BookBaggyEyes from "./pages/BookBaggyEyes";
import LedCryo from "./pages/LedCryo";
import InstantLift from "./pages/InstantLift";
import BaggyEyes from "./pages/BaggyEyes";
import SkinSpecialistChat from "./components/chat/SkinSpecialistChat";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<InstantLift />} />
          <Route path="/instant-lift" element={<Navigate to="/" replace />} />
          <Route path="/baggy-eyes" element={<BaggyEyes />} />
          <Route path="/led-cryo" element={<LedCryo />} />
          <Route path="/book/instant-lift" element={<BookInstantLift />} />
          <Route path="/book/baggy-eyes" element={<BookBaggyEyes />} />
          <Route path="/book/led-cryo" element={<BookLedCryo />} />
          {/* Legacy redirects */}
          <Route path="/led" element={<Navigate to="/" replace />} />
          <Route path="/body-sculpting" element={<Navigate to="/" replace />} />
          <Route path="/book/led" element={<Navigate to="/book/instant-lift" replace />} />
          <Route path="/book/body-sculpting" element={<Navigate to="/book/instant-lift" replace />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SkinSpecialistChat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
