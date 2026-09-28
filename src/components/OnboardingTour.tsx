'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Compass, 
  LayoutDashboard, 
  MessageSquare, 
  GraduationCap, 
  Download, 
  Calendar, 
  Trophy, 
  Bell,
  EyeOff
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector?: string;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  preferredPlacement?: 'right' | 'bottom' | 'top' | 'left' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '#onboarding-welcome',
    category: 'Boas-Vindas',
    title: 'Bem-vindo à BBM School!',
    description: 'Sua plataforma executiva de aceleração no mercado imobiliário e estruturação de capital. Vamos fazer um tour guiado dinâmico pelas principais ferramentas.',
    icon: Compass,
    preferredPlacement: 'bottom'
  },
  {
    id: 'nav-dashboard',
    targetSelector: '#tour-nav-dashboard',
    category: 'Dashboard',
    title: 'Visão Geral & Indicadores',
    description: 'Aqui você tem uma síntese executiva do seu progresso, próximas mentorias ao vivo agendadas e status das missões que você está executando.',
    icon: LayoutDashboard,
    preferredPlacement: 'right'
  },
  {
    id: 'nav-comunidade',
    targetSelector: '#tour-nav-comunidade',
    category: 'Networking',
    title: 'Comunidade & Feed Exclusivo',
    description: 'Conecte-se com outros empresários e alunos, compartilhe cases e dúvidas no feed, assista stories dos mentores e construa parcerias de alto valor.',
    icon: MessageSquare,
    preferredPlacement: 'right'
  },
  {
    id: 'nav-masterclasses',
    targetSelector: '#tour-nav-masterclasses',
    category: 'Aulas & Formação',
    title: 'Masterclasses & Trilhas',
    description: 'Acesse o currículo completo das aulas técnicas sobre viabilidade imobiliária, captação de recursos e engenharia de negócios.',
    icon: GraduationCap,
    preferredPlacement: 'right'
  },
  {
    id: 'nav-recursos',
    targetSelector: '#tour-nav-recursos',
    category: 'Ferramentas Práticas',
    title: 'Central de Recursos',
    description: 'Faça download imediato de planilhas financeiras, modelos de contratos e materiais executivos prontos para uso em suas operações.',
    icon: Download,
    preferredPlacement: 'right'
  },
  {
    id: 'nav-calendario',
    targetSelector: '#tour-nav-calendario',
    category: 'Mentorias',
    title: 'Calendário de Encontros',
    description: 'Consulte a agenda de mentorias ao vivo e eventos do grupo BBM, com links diretos do Zoom e sincronização com seu Google Calendar.',
    icon: Calendar,
    preferredPlacement: 'right'
  },
  {
    id: 'nav-missoes',
    targetSelector: '#tour-nav-missoes, #onboarding-missions',
    category: 'Desafios Práticos',
    title: 'Missões & Entregas',
    description: 'Coloque a teoria em prática! Submeta projetos e resoluções para receber avaliação individual e feedbacks da banca de mentores.',
    icon: Trophy,
    preferredPlacement: 'right'
  },
  {
    id: 'header-controls',
    targetSelector: '#tour-header-notifications',
    category: 'Notificações & Perfil',
    title: 'Notificações & Central Pessoal',
    description: 'Receba alertas de novos encontros e atualizações em tempo real. Você também pode alternar entre os temas claro e escuro e gerenciar seu perfil.',
    icon: Bell,
    preferredPlacement: 'bottom'
  }
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingTour() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isCentered, setIsCentered] = useState(false);
  const tourCardRef = useRef<HTMLDivElement>(null);

  // Mark tour as completed in localStorage so it NEVER shows again automatically
  const markAsCompleted = useCallback(() => {
    try {
      localStorage.setItem('bbm_onboarding_completed', 'true');
      localStorage.setItem('bbm_skip_tutorial', 'true');
      if (user?.id) {
        localStorage.setItem(`bbm_onboarding_completed_${user.id}`, 'true');
      }
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
  }, [user]);

  // Check on mount if user has already seen the onboarding tour
  useEffect(() => {
    try {
      const globalDone = localStorage.getItem('bbm_onboarding_completed');
      const legacySkip = localStorage.getItem('bbm_skip_tutorial');
      const userDone = user?.id ? localStorage.getItem(`bbm_onboarding_completed_${user.id}`) : null;

      if (globalDone === 'true' || legacySkip === 'true' || userDone === 'true') {
        // User already saw the tour! Do NOT show it automatically.
        return;
      }

      // First time access: start tour after short delay to allow DOM to settle
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 900);

      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Error checking tour status:', e);
    }
  }, [user]);

  // Allow re-launching tour manually via custom event
  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStep(0);
      setIsVisible(true);
    };

    window.addEventListener('bbm:start-tour', handleStartTour);
    return () => window.removeEventListener('bbm:start-tour', handleStartTour);
  }, []);

  // Update spotlight and tooltip position based on current step target
  const updateStepPosition = useCallback(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    const target = step.targetSelector ? document.querySelector(step.targetSelector) : null;

    if (!target) {
      // Fallback to center spotlight if target element is not found on current page
      setIsCentered(true);
      setSpotlight(null);
      setTooltipPos({
        top: Math.max(20, (window.innerHeight - 340) / 2),
        left: Math.max(20, (window.innerWidth - 440) / 2)
      });
      return;
    }

    setIsCentered(false);
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const rect = target.getBoundingClientRect();
    const isSquare = Math.abs(rect.width - rect.height) <= 8;
    const padding = isSquare ? 5 : 8;
    
    let spotRect: SpotlightRect;
    if (isSquare) {
      const squareSize = Math.max(rect.width, rect.height) + padding * 2;
      spotRect = {
        top: rect.top + (rect.height / 2) - (squareSize / 2),
        left: rect.left + (rect.width / 2) - (squareSize / 2),
        width: squareSize,
        height: squareSize
      };
    } else {
      spotRect = {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      };
    }
    setSpotlight(spotRect);

    // Calculate tooltip position
    const cardWidth = Math.min(420, window.innerWidth - 32);
    const cardHeight = 280;
    const margin = 16;
    let top = 0;
    let left = 0;

    const placement = step.preferredPlacement || 'right';

    if (placement === 'right') {
      left = spotRect.left + spotRect.width + margin;
      top = spotRect.top + (spotRect.height / 2) - (cardHeight / 3);

      // If overflowing right, place to the left or bottom
      if (left + cardWidth > window.innerWidth - 20) {
        if (spotRect.left - cardWidth - margin > 20) {
          left = spotRect.left - cardWidth - margin;
        } else {
          left = Math.max(16, (window.innerWidth - cardWidth) / 2);
          top = spotRect.top + spotRect.height + margin;
        }
      }
    } else if (placement === 'bottom') {
      left = spotRect.left + (spotRect.width / 2) - (cardWidth / 2);
      top = spotRect.top + spotRect.height + margin;

      // If overflowing below screen, place above if possible or neatly clamp
      if (top + cardHeight > window.innerHeight - 16) {
        if (spotRect.top - cardHeight - margin > 16) {
          top = spotRect.top - cardHeight - margin;
        } else {
          top = Math.max(16, window.innerHeight - cardHeight - 24);
        }
      }
    } else if (placement === 'top') {
      left = spotRect.left + (spotRect.width / 2) - (cardWidth / 2);
      top = spotRect.top - cardHeight - margin;
    }

    // Clamp coordinates within visible screen
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));
    top = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, top));

    setTooltipPos({ top, left });
  }, [isVisible, currentStep]);

  useEffect(() => {
    updateStepPosition();
    window.addEventListener('resize', updateStepPosition);
    window.addEventListener('scroll', updateStepPosition, true);

    return () => {
      window.removeEventListener('resize', updateStepPosition);
      window.removeEventListener('scroll', updateStepPosition, true);
    };
  }, [updateStepPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        markAsCompleted();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          markAsCompleted();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStep, markAsCompleted]);

  if (!isVisible) return null;

  const currentStepData = TOUR_STEPS[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Light, Translucent Backdrop (transparent when spotlight is active so target is crystal clear) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isCentered || !spotlight ? 'bg-black/25 backdrop-blur-[1px]' : 'bg-transparent'
        }`}
        onClick={markAsCompleted}
      />

      {/* Dynamic Cutout Spotlight with Clean Border (No AI Glow) */}
      {spotlight && !isCentered && (
        <div 
          style={{
            position: 'absolute',
            top: `${spotlight.top}px`,
            left: `${spotlight.left}px`,
            width: `${spotlight.width}px`,
            height: `${spotlight.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
            border: '2px solid #C1FF07',
            borderRadius: '6px',
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="z-[10000]"
        />
      )}

      {/* Floating Tour Card */}
      <div
        ref={tourCardRef}
        style={{
          position: 'fixed',
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          width: 'min(400px, calc(100vw - 32px))',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="z-[10001] bg-[#14151e] text-white border border-[#C1FF07]/30 rounded-none p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
      >

        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-[#C1FF07] animate-pulse" />
            <span className="text-[10px] font-bold font-outfit uppercase tracking-widest text-[#C1FF07]">
              {currentStepData.category}
            </span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-xs font-semibold text-text-secondary">
              {currentStep + 1} de {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={markAsCompleted}
            className="p-1 rounded-none text-text-muted hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 bg-transparent cursor-pointer"
            title="Fechar e não mostrar novamente"
          >
            <X size={16} />
          </button>
        </div>

        {/* Title & Icon */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="p-2 rounded-none bg-[#C1FF07]/10 text-[#C1FF07] border border-[#C1FF07]/30 flex-shrink-0">
            <StepIcon size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold font-outfit text-white leading-tight m-0 uppercase tracking-tight">
              {currentStepData.title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <p className="text-xs md:text-sm text-text-secondary leading-relaxed mb-5 font-inter">
          {currentStepData.description}
        </p>

        {/* Progress Dots Bar — Sci-Fi Segments */}
        <div className="flex items-center gap-1.5 mb-5">
          {TOUR_STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-none transition-all duration-300 border-0 cursor-pointer p-0 ${
                idx === currentStep 
                  ? 'w-6 bg-[#C1FF07]' 
                  : idx < currentStep 
                    ? 'w-2 bg-[#C1FF07]/40' 
                    : 'w-2 bg-white/15 hover:bg-white/30'
              }`}
              title={`Ir para etapa ${idx + 1}: ${step.title}`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
          <button
            onClick={markAsCompleted}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white bg-transparent border-0 cursor-pointer transition-colors p-0 font-medium uppercase font-outfit tracking-wider"
          >
            <EyeOff size={13} />
            <span>Pular tour</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="outline-btn py-1.5 px-3 text-xs"
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isLastStep) {
                  markAsCompleted();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
              className="btn-primary py-1.5 px-4 text-xs font-bold"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Concluir</span>
                </>
              ) : (
                <>
                  <span>Próximo</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
