import "./global.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { FilmesProvider } from "./contexts/FilmesContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Filmes from "./pages/Filmes";
import FilmeDetalhes from "./pages/FilmeDetalhes";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SearchProvider>
        <FilmesProvider>
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
                      <Route path="/perfil" element={
                        <ProtectedRoute>
                          <Perfil />
                        </ProtectedRoute>
                      } />
                      {/* Redireciona rota antiga de favoritos para perfil */}
                      <Route path="/favoritos" element={<Navigate to="/perfil" replace />} />
                      <Route path="/admin" element={
                        <ProtectedRoute requireAdmin>
                          <Admin />
                        </ProtectedRoute>
                      } />
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
        </FilmesProvider>
      </SearchProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
