import { useState, useEffect } from 'react';
import { X, Palette, Globe, Video, Bell, Eye, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { preferenciasStorage, PreferenciasUsuario } from '../utils/preferenciasStorage';

interface PreferenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferenciasModal({ isOpen, onClose }: PreferenciasModalProps) {
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarPreferencias();
    }
  }, [isOpen]);

  const carregarPreferencias = async () => {
    try {
      const prefs = await preferenciasStorage.obterPreferencias();
      setPreferencias(prefs);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };

  const handleSalvar = async () => {
    if (!preferencias) return;
    
    setLoading(true);
    try {
      const success = await preferenciasStorage.salvarPreferencias(preferencias);
      if (success) {
        // Aplicar tema se mudou
        preferenciasStorage.aplicarTema(preferencias.tema);
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof PreferenciasUsuario, value: any) => {
    if (!preferencias) return;
    setPreferencias(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (!isOpen || !preferencias) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-vintage-black border border-vintage-gold/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-vintage-gold">Preferências</h2>
          <button
            onClick={onClose}
            className="text-vintage-cream hover:text-vintage-gold transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Aparência */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Aparência
            </h3>
            <div>
              <label className="block text-vintage-cream/70 text-sm mb-2">Tema:</label>
              <select
                value={preferencias.tema}
                onChange={(e) => handleChange('tema', e.target.value)}
                className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
              >
                <option value="vintage">Vintage (Padrão)</option>
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </div>
          </div>

          {/* Idioma */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Idioma
            </h3>
            <div>
              <label className="block text-vintage-cream/70 text-sm mb-2">Idioma da Interface:</label>
              <select
                value={preferencias.idioma}
                onChange={(e) => handleChange('idioma', e.target.value)}
                className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          {/* Vídeo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Video className="h-5 w-5 mr-2" />
              Vídeo
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-vintage-cream/70 text-sm mb-2">Qualidade Padrão:</label>
                <select
                  value={preferencias.qualidade_video}
                  onChange={(e) => handleChange('qualidade_video', e.target.value)}
                  className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
                >
                  <option value="baixa">Baixa (480p)</option>
                  <option value="media">Média (720p)</option>
                  <option value="alta">Alta (1080p)</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoplay"
                  checked={preferencias.autoplay}
                  onChange={(e) => handleChange('autoplay', e.target.checked)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                />
                <label htmlFor="autoplay" className="text-vintage-cream">Reproduzir automaticamente</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="legendas"
                  checked={preferencias.legendas}
                  onChange={(e) => handleChange('legendas', e.target.checked)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                />
                <label htmlFor="legendas" className="text-vintage-cream">Mostrar legendas por padrão</label>
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notificações
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notificacoes_email"
                  checked={preferencias.notificacoes_email}
                  onChange={(e) => handleChange('notificacoes_email', e.target.checked)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                />
                <label htmlFor="notificacoes_email" className="text-vintage-cream">Notificações por email</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notificacoes_push"
                  checked={preferencias.notificacoes_push}
                  onChange={(e) => handleChange('notificacoes_push', e.target.checked)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                />
                <label htmlFor="notificacoes_push" className="text-vintage-cream">Notificações push</label>
              </div>
            </div>
          </div>

          {/* Privacidade */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacidade
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-vintage-cream/70 text-sm mb-2">Visibilidade do Perfil:</label>
                <select
                  value={preferencias.privacidade_perfil}
                  onChange={(e) => handleChange('privacidade_perfil', e.target.value)}
                  className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
                >
                  <option value="publico">Público</option>
                  <option value="amigos">Apenas Amigos</option>
                  <option value="privado">Privado</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="compartilhar_historico"
                  checked={preferencias.compartilhar_historico}
                  onChange={(e) => handleChange('compartilhar_historico', e.target.checked)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                />
                <label htmlFor="compartilhar_historico" className="text-vintage-cream">Compartilhar histórico de visualização</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="mostrar_estatisticas"
                  checked={preferencias.mostrar_estatisticas}
                  onChange={(e) => handleChange('mostrar_estatisticas', e.target.checked)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                />
                <label htmlFor="mostrar_estatisticas" className="text-vintage-cream">Mostrar estatísticas públicas</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-vintage-gold/30 text-vintage-cream hover:bg-vintage-gold hover:text-vintage-black"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={loading}
            className="btn-vintage"
          >
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </div>
    </div>
  );
}
