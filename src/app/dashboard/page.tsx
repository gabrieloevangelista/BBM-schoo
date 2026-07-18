'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Play, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  ArrowRight,
  BookOpen,
  ArrowRightLeft,
  GraduationCap,
  Clock,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/SkeletonLoaders';
import SegmentedProgressBar from '@/components/SegmentedProgressBar';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [greeting, setGreeting] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard Stats Mock
  const [stats, setStats] = useState({
    percentLessons: 45,
    completedMissions: 2,
    totalMissions: 5
  });

  // Recent Event and community highlight
  const [latestEvent, setLatestEvent] = useState<any>(null);
  const [latestPost, setLatestPost] = useState<any>(null);
  const [latestCourses, setLatestCourses] = useState<any[]>([]);

  // Load dynamic data
  useEffect(() => {
    // 1. Time greeting
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Bom dia');
    else if (hr < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    // 2. Check tutorial status
    const skip = localStorage.getItem('bbm_skip_tutorial');
    if (!skip) {
      setShowTutorial(true);
    }

    // 3. Load DB data
    const fetchDashboardDetails = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const db = await response.json();
          
          // Get next event
          const now = new Date();
          const upcoming = (db.calendar_events || [])
            .filter((e: any) => new Date(e.event_date) >= now)
            .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
          
          if (upcoming.length > 0) {
            setLatestEvent(upcoming[0]);
          }

          // Get latest social post
          if (db.posts && db.posts.length > 0) {
            const sortedPosts = [...db.posts].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setLatestPost(sortedPosts[0]);
          }

          // Calculate stats dynamically
          const completedCount = (db.lesson_progress || []).filter((p: any) => p.user_id === user?.id && p.completed).length;
          const totalLessonsCount = (db.lessons || []).length;
          const percent = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;
          const totalM = (db.missions || []).length;
          const approvedM = (db.submissions || []).filter((s: any) => s.user_id === user?.id && s.status === 'approved').length;

          setStats({
            percentLessons: percent || 0,
            completedMissions: approvedM || 0,
            totalMissions: totalM || 1
          });

          // Get latest courses
          if (db.courses) {
            const sorted = [...db.courses].sort((a: any, b: any) => a.sequence_order - b.sequence_order);
            setLatestCourses(sorted.slice(0, 3));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardDetails();
  }, []);

  const tutorialSteps = [
    {
      title: 'Boas-vindas à BBM School!',
      content: 'Este é o seu portal de alta performance. Preparamos uma rápida introdução para você dominar todas as ferramentas e oportunidades disponíveis.'
    },
    {
      title: 'Aulas & Masterclasses',
      content: 'Acesse "Aulas" na barra lateral para ver o currículo completo das masterclasses de engenharia imobiliária, captações de crédito e incorporação.'
    },
    {
      title: 'Simulação de Financiamento',
      content: 'Simule orçamentos de projetos e condições exclusivas de captação de recursos no simulador de crédito da BBM School com taxas diferenciadas.'
    },
    {
      title: 'Central de Recursos',
      content: 'Faça downloads de planilhas de estudo de viabilidade, minutas de contratos e projetos executivos prontos para negócios.'
    },
    {
      title: 'Comunidade & networking',
      content: 'Publique dúvidas, compartilhe conquistas, assista a stories status e envie solicitações de conexões de negócios com outros membros na aba Comunidade.'
    },
    {
      title: 'Missions & Entregas',
      content: 'Coloque as aulas em prática resolvendo as missões propostas. Envie seus trabalhos para que os mentores avaliem e deem feedback.'
    }
  ];

  const handleNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkipTutorial();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
  };

  const skipTutorial = () => {
    localStorage.setItem('bbm_skip_tutorial', 'true');
    setShowTutorial(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('bbm_skip_tutorial', 'true');
    setShowTutorial(false);
  };

  const getFirstName = (fullName: string) => {
    return fullName ? fullName.split(' ')[0] : 'Membro';
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-8">
      
      {/* Onboarding Tutorial Modal / Step Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-5">
          <div className="modal-card w-full max-w-[450px] p-8 relative">
            <div className="flex justify-between items-center mb-4">
              <span className="badge badge-lemon text-xs">
                Etapa {currentStep + 1} de {tutorialSteps.length}
              </span>
              <button 
                onClick={handleSkipTutorial}
                className="border-0 bg-transparent text-text-secondary hover:text-white cursor-pointer text-xs font-semibold py-1 px-2"
              >
                Pular
              </button>
            </div>

            <h3 className="text-lg font-bold mb-3 font-outfit">
              {tutorialSteps[currentStep].title}
            </h3>
            
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              {tutorialSteps[currentStep].content}
            </p>

            <div className="flex justify-between items-center gap-3.5 flex-wrap">
              <button 
                onClick={handleDontShowAgain}
                className="bg-transparent border-0 text-text-muted hover:text-text-secondary cursor-pointer text-xs transition-colors"
              >
                Não mostrar novamente
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button 
                    onClick={handlePrevStep} 
                    className="btn-secondary py-1 px-3"
                  >
                    Voltar
                  </button>
                )}
                <button 
                  onClick={handleNextStep} 
                  className="btn-primary py-1 px-3"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Avançar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Executive Summary Header */}
      <section 
        id="onboarding-welcome" 
        className="relative rounded-2xl overflow-hidden p-6 md:p-8 border border-white/[0.04] flex flex-col justify-center min-h-[160px] bg-cover bg-center"
        style={{ backgroundImage: "url('/bbm_neon_banner.png')" }}
      >
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />
        {/* Dark/Neon Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#12131a] via-[#12131a]/70 to-transparent z-0" />
        
        <div className="relative z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="hud-dot" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#C1FF07] uppercase font-outfit">
              Portal de Alta Performance
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-outfit m-0 text-white leading-tight">
            {greeting}, <span className="text-[#C1FF07]">{user ? getFirstName(user.name) : 'Membro'}</span>.
          </h1>
          <p className="text-white/50 text-xs md:text-sm m-0 max-w-[450px] font-inter">
            Aqui está o seu resumo executivo para hoje. Acelere sua carreira com mentorias reais.
          </p>
        </div>
      </section>


      {/* Row of 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Módulo Atual */}
        <div id="onboarding-progress" className="hud-card p-5 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: '140px' }}>
          <div className="hud-corner-tl" />
          <div className="hud-corner-br" />
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Módulo Atual</p>
              <span className="text-[11px] text-text-muted">Aulas Semanais</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hud-crosshair"><span className="hud-crosshair-dot" /></span>
              <TrendingUp size={18} className="text-[#C1FF07]" />
            </div>
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-xl font-bold font-outfit m-0">{stats.percentLessons}% <span className="text-xs text-text-muted font-normal">Concluído</span></h3>
            
            {/* Sparkline Curve */}
            <svg className="w-full h-8 mt-2 text-[#C1FF07]/30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,25 Q25,22 50,18 T100,5" fill="none" stroke="#C1FF07" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Card 2: Próxima Mentoria */}
        <div id="onboarding-events" className="hud-card p-5 flex flex-col justify-between relative" style={{ minHeight: '140px' }}>
          <div className="hud-corner-tl" />
          <div className="hud-corner-br" />
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Próxima Mentoria</p>
              <div className="flex items-center gap-1.5">
                <span className="hud-dot" />
                <span className="text-[11px] text-text-muted font-semibold text-[#C1FF07]">Ao vivo</span>
              </div>
            </div>
            <CalendarIcon size={18} className="text-[#C1FF07]" />
          </div>
          <div className="mt-4 z-10">
            {latestEvent ? (
              <div>
                <h4 className="text-xs font-bold truncate mb-1 leading-snug">{latestEvent.title}</h4>
                <p className="text-[10px] text-text-secondary truncate m-0">{latestEvent.event_date.split('-').reverse().join('/')} às {latestEvent.start_time.substring(0, 5)}</p>
              </div>
            ) : (
              <h4 className="text-xs font-bold text-text-secondary m-0">Nenhum evento agendado.</h4>
            )}
          </div>
          {/* Subtle Cyberpunk hatch background pattern */}
          <div className="absolute bottom-0 left-0 right-0 z-0">
            <div className="hud-stripes-muted" />
          </div>
        </div>

        {/* Card 3: Suas Missões */}
        <div className="hud-card p-5 flex flex-col justify-between relative" style={{ minHeight: '140px' }}>
          <div className="hud-corner-tl" />
          <div className="hud-corner-br" />
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Suas Missões</p>
              <span className="text-[11px] text-text-muted">{stats.completedMissions} de {stats.totalMissions} concluídas</span>
            </div>
            <Trophy size={18} className="text-[#C1FF07]" />
          </div>
          <div className="mt-4 flex flex-col gap-2 z-10">
            <h3 className="text-xl font-bold font-outfit m-0">
              {stats.totalMissions > 0 ? Math.round((stats.completedMissions / stats.totalMissions) * 100) : 0}% <span className="text-xs text-text-muted font-normal">Concluído</span>
            </h3>
            <SegmentedProgressBar filled={stats.completedMissions} total={stats.totalMissions} segments={16} />
          </div>
        </div>

        {/* Card 4: Próximos Eventos */}
        <div className="hud-card p-5 flex flex-col justify-between relative" style={{ minHeight: '140px' }}>
          <div className="hud-corner-tl" />
          <div className="hud-corner-br" />
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Próximos Eventos</p>
              <span className="text-[11px] text-text-muted">Cronograma</span>
            </div>
            <MoreHorizontal size={18} className="text-[#C1FF07]" />
          </div>
          <div className="mt-4 z-10">
            <h4 className="text-xs font-bold text-text-secondary m-0">Nenhum evento previsto.</h4>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-0">
            <div className="hud-stripes-muted" />
          </div>
        </div>
      </div>

      {/* Latest Masterclasses Section */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-baseline">
          <div>
            <h3 className="text-lg font-bold font-outfit m-0">Últimas Masterclasses</h3>
            <p className="text-xs text-text-secondary m-0 mt-0.5">Adicionadas recentemente ao seu currículo.</p>
          </div>
          <Link 
            href="/masterclasses" 
            className="text-xs text-primary-lemon hover:text-primary-lemon-hover hover:underline no-underline font-bold uppercase tracking-wider font-outfit flex items-center gap-1.5"
          >
            <span>Ver Tudo</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {latestCourses.length > 0 ? (
            latestCourses.map(course => (
              <Link 
                key={course.id} 
                href={`/masterclasses/curso/${course.slug}`} 
                className="relative overflow-hidden rounded-xl aspect-[16/10] w-full group no-underline flex flex-col justify-end border border-white/10"
              >
                <div className="absolute inset-0 z-0">
                  <img 
                    src={course.cover_image_url || '/bbm_neon_masterclass.png'} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                {/* Gradient overlay mimicking the uploaded image */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent opacity-90"></div>
                
                <div className="relative z-20 p-3 md:p-5 flex flex-col gap-0.5 md:gap-1 mt-auto">
                  <span className="text-[8px] md:text-[10px] font-extrabold uppercase tracking-wider text-[#C1FF07] font-outfit drop-shadow-md">
                    CURSO COMPLETO
                  </span>
                  <h3 className="text-white text-xs md:text-lg font-bold leading-tight font-outfit m-0 drop-shadow-lg">
                    {course.title}
                  </h3>
                </div>
              </Link>
            ))
          ) : (
            /* Fallback mock card matching screenshot visual details */
            <div className="glass-panel p-6 col-span-2 md:col-span-3 lg:col-span-4 text-center text-text-secondary text-sm italic">
              Nenhuma masterclass cadastrada.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
