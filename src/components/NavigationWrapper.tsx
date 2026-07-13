'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Download, 
  Calendar, 
  MessageSquare, 
  Trophy, 
  TrendingUp, 
  Hammer, 
  Settings, 
  Layers, 
  ClipboardList, 
  User, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  CheckCircle,
  X,
  Sun,
  Moon,
  Users,
  HelpCircle
} from 'lucide-react';
import { Notification } from '@/lib/db';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load sidebar expanded preference from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('bbm_sidebar_expanded');
    if (saved !== null) {
      setSidebarExpanded(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarExpanded;
    setSidebarExpanded(newState);
    localStorage.setItem('bbm_sidebar_expanded', String(newState));
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        // filter notifications for global or current user
        const list = db.notifications.filter((n: Notification) => n.user_id === null || n.user_id === user.id);
        // sort by date descending
        list.sort((a: Notification, b: Notification) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotifications(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.notifications = db.notifications.map((n: Notification) => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.notifications = db.notifications.map((n: Notification) => 
          (n.user_id === null || n.user_id === user?.id) ? { ...n, is_read: true } : n
        );
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Skip layout wrapper for auth routes
  const noLayoutRoutes = ['/login', '/cadastro-mentorados', '/sem-permissao', '/cadastro'];
  const skipLayout = noLayoutRoutes.includes(pathname) || isLoading;

  if (skipLayout) {
    return <>{children}</>;
  }

  if (!user) {
    return <div className="min-h-screen bg-[#12131a] flex-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-lemon" /></div>;
  }

  // Navigation Links definition
  const menuItems = [
    { label: 'Visão geral', path: '/dashboard', icon: LayoutDashboard, role: 'all' },
    { label: 'Comunidade', path: '/comunidade', icon: MessageSquare, role: 'all' },
    { label: 'Masterclasses', path: '/masterclasses', icon: GraduationCap, role: 'all' },
    { label: 'Recursos', path: '/recursos', icon: Download, role: 'all' },
    { label: 'Calendário', path: '/calendario', icon: Calendar, role: 'all' },
    { label: 'Missões', path: '/missoes', icon: Trophy, role: 'all' },
    { label: 'Oportunidades', path: '#', icon: TrendingUp, role: 'all', badge: 'BREVE' },
    { label: 'Projetos', path: '#', icon: Hammer, role: 'all', badge: 'BREVE' },
    
    // Admin Settings Pages
    { label: 'Gerenciar Membros', path: '/admin/membros', icon: Users, role: 'admin' },
    { label: 'Gerenciar Masterclasses', path: '/admin/reordenacao', icon: Layers, role: 'mentor' },
    { label: 'Gerenciar Banners', path: '/admin/ecossistema', icon: Settings, role: 'admin' },
    { label: 'Gerenciar Missões', path: '/admin/missoes', icon: ClipboardList, role: 'admin' },
    
    // User Profile
    { label: 'Meu Perfil', path: `/perfil/${user.username}`, icon: User, role: 'all' },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.role === 'all') return true;
    if (user.member_type === 'admin') return true;
    if (item.role === 'mentor' && user.member_type === 'mentor') return true;
    return false;
  });

  // Unread notification count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className={`flex min-h-screen relative ${theme === 'light' ? 'bg-[#f0f2f5] text-[#1a1a1a]' : 'bg-[#12131a] text-white'}`}>
      
      {/* Sidebar (Desktop & Tablet) */}
      <aside 
        className={`fixed top-0 left-0 h-screen backdrop-blur-2xl flex flex-col z-50 transition-all duration-300 ${
          sidebarExpanded ? 'w-[260px]' : 'w-[85px]'
        } max-md:hidden ${theme === 'light' ? 'bg-white border-r border-black/8 shadow-[2px_0_20px_rgba(0,0,0,0.06)]' : 'bg-[#171821]/90 border-r border-white/10'}`}
      >
        {/* Sidebar Header Logo */}
        <div className={`h-[70px] flex items-center justify-between px-5 border-b ${theme === 'light' ? 'border-black/8' : 'border-white/10'}`}>
          <Link href="/dashboard" className="flex items-center no-underline">
            {sidebarExpanded ? (
              <img src="/logo_BBM school H cópia.png" alt="BBM School" className="h-8 w-auto object-contain" width={160} height={32} />
            ) : (
              <img src="/logo_Icon BBM school cópia.png" alt="BBM School" className="h-8 w-8 object-contain" width={32} height={32} />
            )}
          </Link>
          {sidebarExpanded ? (
            <button onClick={toggleSidebar} className={`border-0 p-1 rounded cursor-pointer ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`} style={{ minWidth: 'auto' }}>
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button onClick={toggleSidebar} className={`border-0 p-1 rounded cursor-pointer ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`} style={{ minWidth: 'auto' }}>
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-grow py-5 px-3.5 flex flex-col gap-4 overflow-y-auto scrollbar-none">
          {/* Group 1: Principal */}
          <div className="flex flex-col gap-1.5">
            {filteredItems.filter(item => ['Visão geral', 'Comunidade', 'Masterclasses', 'Recursos', 'Calendário', 'Missões', 'Oportunidades', 'Projetos'].includes(item.label)).map(item => {
              const Icon = item.icon;
              const isBreve = item.badge === 'BREVE';
              const isActive = pathname === item.path || (item.path !== '#' && pathname.startsWith(item.path + '/'));
              
              if (isBreve) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center p-3 rounded-lg text-text-muted/60 font-outfit font-medium text-sm gap-3 cursor-not-allowed select-none"
                    title="Esta funcionalidade estará disponível em breve!"
                  >
                    <Icon size={20} className="flex-shrink-0 opacity-40" />
                    {sidebarExpanded && (
                      <div className="flex items-center justify-between flex-grow">
                        <span>{item.label}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider font-outfit">Breve</span>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`flex items-center p-3 rounded no-underline font-outfit font-medium text-sm transition-all duration-200 gap-3 cursor-pointer ${
                    isActive 
                      ? theme === 'light'
                        ? 'bg-[#5a9200]/10 text-[#5a9200] font-bold'
                        : 'bg-[#C1FF07]/10 text-[#C1FF07] font-bold'
                      : theme === 'light' 
                        ? 'text-gray-500 hover:bg-black/5 hover:text-gray-900' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarExpanded && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* VER TODO O ECOSSISTEMA Button */}
          {sidebarExpanded && (
            <div className="px-1.5 py-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-2.5 px-3 text-[10px] font-bold font-outfit uppercase tracking-wider rounded border bg-transparent cursor-pointer transition-all duration-200 text-center flex items-center justify-center"
                style={{
                  borderColor: theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)',
                  color: theme === 'light' ? '#5a9200' : 'rgba(255,255,255,0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme === 'light' ? '#5a9200' : 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.color = theme === 'light' ? '#4a7a00' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = theme === 'light' ? '#5a9200' : 'rgba(255,255,255,0.6)';
                }}
              >
                Ver Todo o Ecossistema
              </button>
            </div>
          )}

          {/* Group 2: Administration (if admin/mentor and contains admin links) */}
          {(user.member_type === 'admin' || user.member_type === 'mentor') && filteredItems.some(item => ['Gerenciar Membros', 'Gerenciar Masterclasses', 'Gerenciar Banners', 'Gerenciar Missões'].includes(item.label)) && (
            <div className={`pt-3 border-t flex flex-col gap-1.5 ${theme === 'light' ? 'border-black/8' : 'border-white/8'}`}>
              {sidebarExpanded && <span className={`text-[10px] font-bold tracking-wider px-3 mb-1.5 uppercase font-outfit ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Administração</span>}
              {filteredItems.filter(item => ['Gerenciar Membros', 'Gerenciar Masterclasses', 'Gerenciar Banners', 'Gerenciar Missões'].includes(item.label)).map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Link 
                    key={item.path} 
                    href={item.path} 
                    className={`flex items-center p-3 rounded no-underline font-outfit font-medium text-sm transition-all duration-200 gap-3 cursor-pointer ${
                      isActive 
                        ? theme === 'light'
                          ? 'bg-[#5a9200]/10 text-[#5a9200] font-bold'
                          : 'bg-[#C1FF07]/10 text-[#C1FF07] font-bold'
                        : theme === 'light' 
                          ? 'text-gray-500 hover:bg-black/5 hover:text-gray-900' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {sidebarExpanded && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Group 3: Account */}
          <div className={`pt-3 border-t flex flex-col gap-1.5 ${theme === 'light' ? 'border-black/8' : 'border-white/8'}`}>
            {sidebarExpanded && <span className={`text-[10px] font-bold tracking-wider px-3 mb-1.5 uppercase font-outfit ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Minha Conta</span>}
            {filteredItems.filter(item => item.label === 'Meu Perfil').map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link 
                  key={item.path} 
                  href={item.path} 
                  className={`flex items-center p-3 rounded no-underline font-outfit font-medium text-sm transition-all duration-200 gap-3 cursor-pointer ${
                    isActive 
                      ? theme === 'light'
                        ? 'bg-[#5a9200]/10 text-[#5a9200] font-bold'
                        : 'bg-[#C1FF07]/10 text-[#C1FF07] font-bold'
                      : theme === 'light' 
                        ? 'text-gray-500 hover:bg-black/5 hover:text-gray-900' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarExpanded && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout & Support Section */}
        <div className={`p-3.5 border-t flex flex-col gap-1 ${theme === 'light' ? 'border-black/8' : 'border-white/10'}`}>
          <Link
            href="mailto:suporte@bbmschool.com.br"
            className="flex items-center p-3 rounded-lg w-full border-0 bg-transparent text-left hover:bg-white/5 text-text-secondary hover:text-white no-underline font-outfit font-medium text-sm transition-all duration-200 gap-3 cursor-pointer"
          >
            <HelpCircle size={20} className="flex-shrink-0 text-text-secondary" />
            {sidebarExpanded && <span>Suporte</span>}
          </Link>
          <button 
            onClick={logout} 
            className="flex items-center p-3 rounded-lg w-full border-0 bg-transparent text-left hover:bg-red-950/20 text-text-secondary hover:text-red-400 font-outfit font-medium text-sm transition-all duration-200 gap-3 cursor-pointer"
          >
            <LogOut size={20} className="flex-shrink-0 text-red-500" />
            {sidebarExpanded && <span className="text-red-400">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area Container */}
      <div 
        className={`flex-grow flex flex-col min-h-screen transition-all duration-300 ${
          sidebarExpanded ? 'md:ml-[260px]' : 'md:ml-[85px]'
        }`}
      >
        
        {/* Header */}
        <header className={`h-[70px] sticky top-0 backdrop-blur-xl border-b flex items-center justify-between px-6 md:px-10 z-40 ${theme === 'light' ? 'bg-white/80 border-black/8 shadow-sm' : 'bg-[#020205]/60 border-white/10'}`}>
          <div>
            <h2 className={`text-lg font-bold tracking-tight font-outfit ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {pathname === '/dashboard' && 'Visão geral'}
              {pathname.startsWith('/masterclasses') && 'Masterclasses'}
              {pathname === '/recursos' && 'Central de Recursos'}
              {pathname === '/calendario' && 'Calendário de Eventos'}
              {pathname === '/comunidade' && 'Comunidade & Feed'}
              {pathname === '/missoes' && 'Missões Técnicas'}
              {pathname === '/oportunidades' && 'Oportunidades de Co-investimento'}
              {pathname === '/projetos' && 'Projetos e Simulador'}
              {pathname.startsWith('/admin') && 'Painel de Administração'}
              {pathname.startsWith('/perfil') && 'Perfil do Membro'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center p-2 rounded-full border border-transparent cursor-pointer transition-colors hover:text-[#C1FF07] ${theme === 'light' ? 'text-gray-500 hover:bg-black/5' : 'text-gray-400 hover:bg-white/5'}`}
              style={{ minWidth: 'auto' }}
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative flex items-center justify-center p-2 rounded-full border border-transparent hover:bg-white/5 cursor-pointer transition-colors"
                style={{ color: unreadCount > 0 ? 'var(--color-primary-lemon)' : 'var(--color-text-secondary)', minWidth: 'auto' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-red rounded-full border border-bg-deep" />
                )}
              </button>

              {/* Opaque Solid Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute top-[50px] right-0 w-80 max-h-[400px] overflow-y-auto z-50 p-4 rounded-2xl flex flex-col ${theme === 'light' ? 'bg-white border border-black/8 shadow-[0_20px_50px_rgba(0,0,0,0.12)]' : 'bg-[#0a0a0f] border border-[#C1FF07]/30 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'}`}>
                  <div className={`flex justify-between items-center pb-2.5 mb-3 border-b ${theme === 'light' ? 'border-black/8' : 'border-white/10'}`}>
                    <h3 className="text-sm font-bold text-primary-lemon font-outfit">Notificações</h3>
                    <div className="flex gap-2">
                      <button onClick={handleMarkAllAsRead} className={`border-0 text-xs bg-transparent cursor-pointer py-0.5 px-1.5 ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}>
                        Lidas
                      </button>
                      <button onClick={() => setShowNotifications(false)} className={`border-0 p-1 bg-transparent cursor-pointer ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-5 text-text-muted text-xs font-medium">
                      Nenhuma notificação encontrada.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-lg border-l-4 transition-all duration-200 ${
                            n.is_read 
                              ? 'bg-transparent border-l-transparent' 
                              : 'bg-primary-lemon/4 border-l-primary-lemon'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <h4 className={`text-xs font-semibold leading-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{n.title}</h4>
                            {!n.is_read && (
                              <button 
                                onClick={() => handleMarkAsRead(n.id)}
                                className="border-0 text-accent-green hover:text-emerald-300 bg-transparent p-0 cursor-pointer"
                              >
                                <CheckCircle size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-text-secondary mt-1 leading-normal">{n.description}</p>
                          <span className="text-[9px] text-text-muted mt-1 block">
                            {new Date(n.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar Indicator */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => router.push(`/perfil/${user.username}`)}
                className="cursor-pointer flex items-center gap-3"
              >
                {user.img ? (
                  <img 
                    src={user.img} 
                    alt={user.name} 
                    className="w-9 h-9 rounded-full border border-primary-lemon object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-lemon/10 border border-primary-lemon text-primary-lemon flex items-center justify-center font-semibold text-sm">
                    {user.initials}
                  </div>
                )}
                <div className="max-md:hidden text-left">
                  <p className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{user.name}</p>
                  <p className="text-[10px] text-[#C1FF07] font-medium uppercase tracking-wider" style={{ color: theme === 'light' ? '#6aaa00' : '#C1FF07' }}>
                    {user.member_type === 'admin' ? 'Admin' : user.member_type === 'mentor' ? 'Mentor' : 'Mentorado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-grow p-6 pb-24 md:p-10 md:pb-10 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bottom Navigation Tab Bar (Mobile Only) */}
      <nav className={`fixed bottom-0 left-0 w-full h-16 backdrop-blur-xl z-50 flex justify-around items-center px-2.5 md:hidden ${theme === 'light' ? 'bg-white/95 border-t border-black/8' : 'bg-[#12131a]/96 border-t border-white/5'}`}>
        <Link href="/dashboard" className={`flex flex-col items-center justify-center no-underline text-[10px] font-outfit font-medium gap-1 flex-grow h-full ${pathname === '/dashboard' ? (theme === 'light' ? 'text-[#5a9200]' : 'text-primary-lemon') : (theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-text-secondary hover:text-white')}`}>
          <LayoutDashboard size={20} />
          <span>Início</span>
        </Link>
        <Link href="/masterclasses" className={`flex flex-col items-center justify-center no-underline text-[10px] font-outfit font-medium gap-1 flex-grow h-full ${pathname.startsWith('/masterclasses') ? (theme === 'light' ? 'text-[#5a9200]' : 'text-primary-lemon') : (theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-text-secondary hover:text-white')}`}>
          <GraduationCap size={20} />
          <span>Aulas</span>
        </Link>
        <Link href="/calendario" className={`flex flex-col items-center justify-center no-underline text-[10px] font-outfit font-medium gap-1 flex-grow h-full ${pathname === '/calendario' ? (theme === 'light' ? 'text-[#5a9200]' : 'text-primary-lemon') : (theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-text-secondary hover:text-white')}`}>
          <Calendar size={20} />
          <span>Agenda</span>
        </Link>
        <Link href="/comunidade" className={`flex flex-col items-center justify-center no-underline text-[10px] font-outfit font-medium gap-1 flex-grow h-full ${pathname === '/comunidade' ? (theme === 'light' ? 'text-[#5a9200]' : 'text-primary-lemon') : (theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-text-secondary hover:text-white')}`}>
          <MessageSquare size={20} />
          <span>Social</span>
        </Link>
        <Link href={`/perfil/${user.username}`} className={`flex flex-col items-center justify-center no-underline text-[10px] font-outfit font-medium gap-1 flex-grow h-full ${pathname.startsWith('/perfil') ? (theme === 'light' ? 'text-[#5a9200]' : 'text-primary-lemon') : (theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-text-secondary hover:text-white')}`}>
          <User size={20} />
          <span>Perfil</span>
        </Link>
      </nav>
    </div>
  );
}
