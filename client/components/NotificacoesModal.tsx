import { useState } from 'react';
import { X, Bell, Mail, Smartphone, Calendar, Star, Heart } from 'lucide-react';
import { Button } from './ui/button';

interface NotificacoesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificacoesModal({ isOpen, onClose }: NotificacoesModalProps) {
  const [notificacoes, setNotificacoes] = useState({
    email: {
      novos_filmes: true,
      recomendacoes: true,
      atividades: false,
      newsletter: true
    },
    push: {
      novos_filmes: false,
      recomendacoes: false,
      atividades: true,
      lembretes: true
    },
    frequencia: 'diaria' // diaria, semanal, mensal
  });

  const handleChange = (tipo: 'email' | 'push', chave: string, valor: boolean) => {
    setNotificacoes(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [chave]: valor
      }
    }));
  };

  const handleSalvar = () => {
    // Aqui você salvaria as configurações no banco
    console.log('Salvando notificações:', notificacoes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-vintage-black border border-vintage-gold/20 rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-vintage-gold">Notificações</h2>
          <button
            onClick={onClose}
            className="text-vintage-cream hover:text-vintage-gold transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Email */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Notificações por Email
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="email_novos_filmes"
                    checked={notificacoes.email.novos_filmes}
                    onChange={(e) => handleChange('email', 'novos_filmes', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="email_novos_filmes" className="text-vintage-cream">Novos filmes adicionados</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="email_recomendacoes"
                    checked={notificacoes.email.recomendacoes}
                    onChange={(e) => handleChange('email', 'recomendacoes', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="email_recomendacoes" className="text-vintage-cream">Recomendações personalizadas</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="email_atividades"
                    checked={notificacoes.email.atividades}
                    onChange={(e) => handleChange('email', 'atividades', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="email_atividades" className="text-vintage-cream">Atividades da conta</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="email_newsletter"
                    checked={notificacoes.email.newsletter}
                    onChange={(e) => handleChange('email', 'newsletter', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="email_newsletter" className="text-vintage-cream">Newsletter semanal</label>
                </div>
              </div>
            </div>
          </div>

          {/* Push */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Notificações Push
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="push_novos_filmes"
                    checked={notificacoes.push.novos_filmes}
                    onChange={(e) => handleChange('push', 'novos_filmes', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="push_novos_filmes" className="text-vintage-cream">Novos filmes</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="push_recomendacoes"
                    checked={notificacoes.push.recomendacoes}
                    onChange={(e) => handleChange('push', 'recomendacoes', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="push_recomendacoes" className="text-vintage-cream">Recomendações</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="push_atividades"
                    checked={notificacoes.push.atividades}
                    onChange={(e) => handleChange('push', 'atividades', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="push_atividades" className="text-vintage-cream">Atividades</label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="push_lembretes"
                    checked={notificacoes.push.lembretes}
                    onChange={(e) => handleChange('push', 'lembretes', e.target.checked)}
                    className="w-4 h-4 text-vintage-gold bg-vintage-black/20 border-vintage-gold/30 rounded"
                  />
                  <label htmlFor="push_lembretes" className="text-vintage-cream">Lembretes</label>
                </div>
              </div>
            </div>
          </div>

          {/* Frequência */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-vintage-gold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Frequência
            </h3>
            <div>
              <label className="block text-vintage-cream/70 text-sm mb-2">Frequência de Resumo:</label>
              <select
                value={notificacoes.frequencia}
                onChange={(e) => setNotificacoes(prev => ({ ...prev, frequencia: e.target.value }))}
                className="w-full p-3 bg-vintage-black/20 border border-vintage-gold/30 rounded text-vintage-cream"
              >
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
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
            className="btn-vintage"
          >
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
