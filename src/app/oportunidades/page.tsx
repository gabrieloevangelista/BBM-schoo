'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Briefcase, 
  ArrowRight, 
  X,
  FileCheck,
  CheckCircle,
  Clock,
  ShieldCheck,
  Building,
  FileText,
  Globe,
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { OportunidadesSkeleton } from '@/components/SkeletonLoaders';

export default function OportunidadesPage() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pitch Modal state
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [interestRegistered, setInterestRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setOpportunities(db.investment_opportunities || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOpportunities();
    }
  }, [user]);

  const handleManifestInterest = async (oppId: string) => {
    setRegistering(true);
    
    // Simulate API registration call
    setTimeout(() => {
      setRegistering(false);
      setInterestRegistered(true);
      
      // Auto-hide feedback after 3 seconds
      setTimeout(() => {
        setInterestRegistered(false);
        setSelectedOpp(null);
      }, 4000);
    }, 1200);
  };

  if (isLoading) {
    return <OportunidadesSkeleton />;
  }

  return (
    <div className="relative flex flex-col gap-6">
      
      {/* Page Header */}
      <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Consultorias & Programas Avançados</h1>
      <p className="text-text-secondary text-sm font-medium leading-normal -mt-3 max-w-2xl">
        Acesso restrito para mentorados. Candidate-se para os programas avançados de aceleração comercial, marketing digital de performance e estruturação empresarial.
      </p>

      {opportunities.length === 0 ? (
        <div className="glass-panel p-10 text-center text-text-secondary text-sm">
          Nenhum programa de aceleração ativo no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map(opp => (
            <div 
              key={opp.id} 
              className="glass-panel glass-panel-hover flex flex-col overflow-hidden h-full"
            >
              {opp.image_url && (
                <div className="h-52 overflow-hidden relative">
                  <img src={opp.image_url} alt={opp.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <span className="badge badge-lemon">{opp.badge || 'VIP'}</span>
                  </div>
                </div>
              )}

              <div className="p-6 flex-grow flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-primary-lemon font-bold uppercase tracking-wider">
                    {opp.category_label || opp.category}
                  </span>
                  <h3 className="text-base font-bold text-white font-outfit">{opp.title}</h3>
                  <p className="text-text-secondary text-xs leading-relaxed mb-6">
                    {opp.description}
                  </p>
                </div>

                <div>
                  {/* Key Metrics Columns */}
                  <div className="grid grid-cols-2 gap-4 py-3.5 border-t border-b border-white/5 mb-5">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider">Impacto Projetado</span>
                      <p className="text-primary-lemon text-sm font-bold flex items-center gap-1 mt-0.5">
                        <TrendingUp size={14} />
                        <span>{opp.target_irr}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider">Investimento</span>
                      <p className="text-white text-sm font-bold flex items-center gap-0.5 mt-0.5">
                        <DollarSign size={14} className="text-accent-green" />
                        <span>{opp.min_investment}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-secondary flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-accent-green" /> Garantia de Entrega (SLA)
                    </span>
                    
                    <button 
                      onClick={() => setSelectedOpp(opp)}
                      className="px-4 py-2 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep rounded-lg text-xs font-bold hover:shadow-[0_0_12px_rgba(193,255,7,0.2)] cursor-pointer transition-all duration-200 flex items-center gap-1 font-outfit"
                    >
                      <span>Avaliar Programa</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pitch Modal - SOLID OPAQUE BACKGROUND */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="modal-card max-w-[620px] w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-outfit">
                Diligência do Programa de Escala
              </h3>
              <button 
                onClick={() => setSelectedOpp(null)}
                className="bg-transparent border-0 p-1 text-text-secondary hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {selectedOpp.image_url && (
              <img 
                src={selectedOpp.image_url} 
                alt={selectedOpp.title} 
                className="w-full h-52 object-cover rounded-xl"
              />
            )}

            <div className="flex flex-col gap-2">
              <span className="badge badge-lemon self-start">
                {selectedOpp.category_label || selectedOpp.category}
              </span>
              
              <h2 className="text-xl font-bold text-white font-outfit mt-1">
                {selectedOpp.title}
              </h2>

              <p className="text-text-secondary text-xs md:text-sm leading-relaxed mt-1">
                {selectedOpp.long_description || selectedOpp.description}
              </p>
            </div>

            {/* Term Sheet Summary */}
            <div className="bg-white/1 border border-white/5 rounded-xl p-5 flex flex-col gap-3">
              <h4 className="text-[10px] text-primary-lemon font-bold uppercase tracking-wider">
                Detalhamento do Acompanhamento
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-text-muted">Duração do Programa:</p>
                  <p className="text-white font-semibold mt-0.5">6 meses (Encontros semanais)</p>
                </div>
                <div>
                  <p className="text-text-muted">Vagas Disponíveis:</p>
                  <p className="text-white font-semibold mt-0.5">5 empresas por trimestre</p>
                </div>
                <div>
                  <p className="text-text-muted">Foco Principal:</p>
                  <p className="text-primary-lemon font-semibold mt-0.5">{selectedOpp.target_irr}</p>
                </div>
                <div>
                  <p className="text-text-muted">Investimento do Programa:</p>
                  <p className="text-white font-semibold mt-0.5">{selectedOpp.min_investment}</p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            {interestRegistered ? (
              <div className="p-4 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                <span>Interesse registrado! Nossa equipe entrará em contato para agendar sua entrevista de diagnóstico.</span>
              </div>
            ) : (
              <button 
                onClick={() => handleManifestInterest(selectedOpp.id)}
                className="w-full py-3.5 bg-gradient-to-r from-primary-lemon to-primary-lemon-hover text-bg-deep font-bold rounded-lg hover:shadow-[0_0_12px_rgba(193,255,7,0.2)] transition-all duration-200 cursor-pointer text-xs flex items-center justify-center gap-2 font-outfit"
                disabled={registering}
              >
                <FileCheck size={18} />
                <span>{registering ? 'Registrando Interesse...' : 'Manifestar Interesse na Mentoria'}</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
