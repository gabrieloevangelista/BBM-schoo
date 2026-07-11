'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Download, 
  Calculator, 
  ArrowRight, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  Coins
} from 'lucide-react';
import { ProjetosSkeleton } from '@/components/SkeletonLoaders';

export default function ProjetosPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulator Inputs
  const [verbaTrafego, setVerbaTrafego] = useState<number>(10000); // R$ 10.000 / month
  const [ticketMedio, setTicketMedio] = useState<number>(2000); // R$ 2.000
  const [custoLead, setCustoLead] = useState<number>(50); // R$ 50 CPL

  // Simulator Outputs
  const [leadsGerados, setLeadsGerados] = useState<number>(0);
  const [faturamentoClub, setFaturamentoClub] = useState<number>(0);
  const [faturamentoMercado, setFaturamentoMercado] = useState<number>(0);
  const [lucroAdicional, setLucroAdicional] = useState<number>(0);
  const [roiClub, setRoiClub] = useState<number>(0);

  // Simulated consultant contact
  const [consultantSubmitting, setConsultantSubmitting] = useState(false);
  const [consultantSuccess, setConsultantSuccess] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setProjects(db.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Run ROI calculations on input changes
  useEffect(() => {
    // 1. Calculate leads generated
    const leads = custoLead > 0 ? verbaTrafego / custoLead : 0;
    setLeadsGerados(Math.round(leads));

    // 2. Conversion Rates
    const convClub = 0.05; // 5% conversion rate using BBM sales playbook
    const convMarket = 0.02; // 2% average market conversion rate

    // 3. Simulated sales and revenues
    const vendasClub = leads * convClub;
    const vendasMarket = leads * convMarket;

    const fatClub = vendasClub * ticketMedio;
    const fatMarket = vendasMarket * ticketMedio;

    setFaturamentoClub(fatClub);
    setFaturamentoMercado(fatMarket);

    // 4. ROI Factor (Revenue / Traffic Spend)
    const roiFactor = verbaTrafego > 0 ? fatClub / verbaTrafego : 0;
    setRoiClub(roiFactor);

    // 5. Additional Profit (Revenue difference)
    const diff = fatClub - fatMarket;
    setLucroAdicional(diff > 0 ? diff : 0);
  }, [verbaTrafego, ticketMedio, custoLead]);

  const handleSpeakToConsultant = () => {
    setConsultantSubmitting(true);
    
    // Simulate API contact desk
    setTimeout(() => {
      setConsultantSubmitting(false);
      setConsultantSuccess(true);
      
      setTimeout(() => {
        setConsultantSuccess(false);
      }, 4000);
    }, 1200);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) {
    return <ProjetosSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-text-base tracking-tight font-outfit">Simulador de ROI & Templates</h1>
      <p className="text-text-secondary text-sm font-medium leading-normal -mt-3 max-w-2xl">
        Acesse ferramentas de prospecção e simule o escalonamento do seu faturamento mensal com base nas métricas de conversão do seu funil.
      </p>

      {/* Simulator Section */}
      <section className="glass-panel p-6 md:p-8 flex flex-col gap-5 bg-gradient-to-br from-primary-lemon/2 to-transparent">
        <h2 className="text-lg font-bold text-text-base flex items-center gap-2.5 font-outfit">
          <Calculator size={22} className="text-primary-lemon" />
          <span>Simulador de Escalonamento e Vendas B2B</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs Column */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-text-secondary font-medium font-outfit flex justify-between">
                <span>Verba de Tráfego Mensal</span>
                <span className="text-text-base font-semibold">{formatCurrency(verbaTrafego)}</span>
              </label>
              <input 
                type="range" 
                min={1000} 
                max={200000} 
                step={1000}
                value={verbaTrafego} 
                onChange={(e) => setVerbaTrafego(Number(e.target.value))}
                className="w-full accent-primary-lemon cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>R$ 1.000</span>
                <span>R$ 200k</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-text-secondary font-medium font-outfit flex justify-between">
                <span>Ticket Médio do Produto/Serviço</span>
                <span className="text-text-base font-semibold">{formatCurrency(ticketMedio)}</span>
              </label>
              <input 
                type="range" 
                min={100} 
                max={30000} 
                step={100}
                value={ticketMedio} 
                onChange={(e) => setTicketMedio(Number(e.target.value))}
                className="w-full accent-primary-lemon cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>R$ 100</span>
                <span>R$ 30k</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-text-secondary font-medium font-outfit flex justify-between">
                <span>Custo por Lead Qualificado (CPL)</span>
                <span className="text-text-base font-semibold">{formatCurrency(custoLead)}</span>
              </label>
              <input 
                type="range" 
                min={5} 
                max={250} 
                step={5}
                value={custoLead} 
                onChange={(e) => setCustoLead(Number(e.target.value))}
                className="w-full accent-primary-lemon cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>R$ 5</span>
                <span>R$ 250</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="glass-panel p-5 flex flex-col justify-between bg-white/1">
            <div className="flex flex-col gap-4">
              <span className="badge badge-lemon self-start">
                Funil Avançado BBM (5% de Conversão)
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider">Leads Qualificados</p>
                  <h4 className="text-lg font-bold text-text-base mt-0.5">{leadsGerados} leads</h4>
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider">ROI Estimado</p>
                  <h4 className="text-lg font-bold text-text-base mt-0.5">{roiClub.toFixed(1)}x</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Faturamento BBM</p>
                  <p className="text-primary-lemon text-sm font-bold">{formatCurrency(faturamentoClub)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase">Faturamento Mercado</p>
                  <p className="text-text-secondary text-sm font-medium line-through">{formatCurrency(faturamentoMercado)}</p>
                </div>
              </div>

              <div className="p-3.5 bg-accent-green/5 border border-accent-green/15 rounded-lg flex flex-col gap-0.5">
                <span className="text-[10px] text-accent-green font-semibold uppercase tracking-wider">
                  Lucro Adicional Gerado
                </span>
                <p className="text-accent-green text-lg font-extrabold flex items-center gap-1.5 mt-0.5">
                  <Coins size={18} />
                  <span>{formatCurrency(lucroAdicional)}</span>
                </p>
              </div>
            </div>

            {consultantSuccess ? (
              <div className="p-3 bg-accent-green/10 border border-accent-green/30 text-accent-green rounded-lg text-xs font-semibold text-center mt-5 flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                <span>Simulação enviada! Um consultor de escala entrará em contato.</span>
              </div>
            ) : (
              <button 
                onClick={handleSpeakToConsultant}
                className="btn-primary w-full mt-5"
                disabled={consultantSubmitting}
              >
                <span>Diagnóstico com Consultor / Escalar Empresa</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Blueprint Library Section */}
      <h2 className="text-lg font-bold text-text-base mb-2 font-outfit mt-4">
        Playbooks e Templates de Marketing & Vendas
      </h2>

      {projects.length === 0 ? (
        <div className="glass-panel p-8 text-center text-text-secondary text-sm">
          Nenhum material cadastrado na biblioteca.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="glass-panel glass-panel-hover flex flex-col overflow-hidden h-full"
            >
              {project.image_url && (
                <div className="h-44 overflow-hidden relative">
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                  <span className="badge badge-lemon absolute bottom-3 left-3">
                    {project.category}
                  </span>
                </div>
              )}

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-base mb-2">{project.title}</h3>
                  <p className="text-text-secondary text-xs leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <span className="text-[10px] text-text-muted font-medium">Status: Disponível</span>
                  <a 
                    href="/downloads/planta_executiva.pdf" 
                    target="_blank" 
                    download
                    className="btn-secondary no-underline inline-flex items-center gap-1.5"
                  >
                    <Download size={12} />
                    <span>Download Playbook</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
