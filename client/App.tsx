import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Index from "./pages/Index";
import Filmes from "./pages/Filmes";
import FilmeDetalhes from "./pages/FilmeDetalhes";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Favoritos from "./pages/Favoritos";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <div className="min-h-screen bg-vintage-black vintage-scrollbar">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <>
                  <Header />
                  <main className="min-h-screen">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/filmes" element={<Filmes />} />
                      <Route path="/filme/:id" element={<FilmeDetalhes />} />
                      <Route path="/perfil" element={<PlaceholderPage title="Meu Perfil" />} />
                      <Route path="/favoritos" element={<Favoritos />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/categorias" element={<PlaceholderPage title="Categorias" />} />
                      <Route path="/sobre" element={<PlaceholderPage title="Sobre Nós" />} />
                      <Route path="/contato" element={<PlaceholderPage title="Contato" />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
            </div>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
