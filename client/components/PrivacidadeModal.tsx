import { useState } from 'react';
import { X, Shield, Eye, EyeOff, Users, User, Lock, Globe } from 'lucide-react';
import { Button } from './ui/button';

interface PrivacidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacidadeModal({ isOpen, onClose }: PrivacidadeModalProps) {
  const [privacidade, setPrivacidade] = useState({
    perfil: 'publico', // publico, amigos, privado
    historico: true,
    estatisticas: true,
    atividades: false,
    pesquisa: true,
    recomendacoes: true
  });

  const handleChange = (chave: string, valor: any) => {
    setPrivacidade(prev => ({
      ...prev,
      [chave]: valor
    }));
  };

  const handleSalvar = () => {
    // Aqui você salvaria as configurações no banco
    console.log('Salvando privacidade:', privacidade);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-vintage-black border border-vintage-gold/20 rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-vintage-gold">Privacidade</h2>
          <button
            onClick={onClose}
            className="text-vintage-cream hover:text-vintage-gold transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Visibilidade do Perfil */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <User className="h-5 w-5 mr-2" />
              Visibilidade do Perfil
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="perfil_publico"
                  name="perfil"
                  value="publico"
                  checked={privacidade.perfil === 'publico'}
                  onChange={(e) => handleChange('perfil', e.target.value)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30"
                />
                <label htmlFor="perfil_publico" className="text-vintage-cream flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Público - Qualquer pessoa pode ver meu perfil
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="perfil_amigos"
                  name="perfil"
                  value="amigos"
                  checked={privacidade.perfil === 'amigos'}
                  onChange={(e) => handleChange('perfil', e.target.value)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30"
                />
                <label htmlFor="perfil_amigos" className="text-vintage-cream flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Apenas Amigos - Apenas meus amigos podem ver meu perfil
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="perfil_privado"
                  name="perfil"
                  value="privado"
                  checked={privacidade.perfil === 'privado'}
                  onChange={(e) => handleChange('perfil', e.target.value)}
                  className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30"
                />
                <label htmlFor="perfil_privado" className="text-vintage-cream flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Privado - Apenas eu posso ver meu perfil
                </label>
              </div>
            </div>
          </div>

          {/* Dados Compartilhados */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Dados Compartilhados
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="historico"
                    checked={privacidade.historico}
                    onChange={(e) => handleChange('historico', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="historico" className="text-vintage-cream">Compartilhar histórico de visualização</label>
                </div>
                <Eye className="h-4 w-4 text-vintage-gold" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="estatisticas"
                    checked={privacidade.estatisticas}
                    onChange={(e) => handleChange('estatisticas', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="estatisticas" className="text-vintage-cream">Mostrar estatísticas públicas</label>
                </div>
                <Eye className="h-4 w-4 text-vintage-gold" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="atividades"
                    checked={privacidade.atividades}
                    onChange={(e) => handleChange('atividades', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="atividades" className="text-vintage-cream">Compartilhar atividades recentes</label>
                </div>
                <EyeOff className="h-4 w-4 text-vintage-cream/50" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="pesquisa"
                    checked={privacidade.pesquisa}
                    onChange={(e) => handleChange('pesquisa', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="pesquisa" className="text-vintage-cream">Aparecer em pesquisas</label>
                </div>
                <Eye className="h-4 w-4 text-vintage-gold" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="recomendacoes"
                    checked={privacidade.recomendacoes}
                    onChange={(e) => handleChange('recomendacoes', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="recomendacoes" className="text-vintage-cream">Usar dados para recomendações</label>
                </div>
                <Eye className="h-4 w-4 text-vintage-gold" />
              </div>
            </div>
          </div>

          {/* Informações */}
          <div className="bg-vintage-gold/10 border border-vintage-gold/20 rounded-lg p-4">
            <h4 className="text-vintage-gold font-semibold mb-2">Sobre Privacidade</h4>
            <p className="text-vintage-cream/70 text-sm">
              Suas configurações de privacidade controlam como suas informações são compartilhadas 
              com outros usuários e como são usadas para melhorar sua experiência.
            </p>
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
            className="btn-vintage"
          >
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
