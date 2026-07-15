'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Calendar, 
  GraduationCap, 
  TrendingUp, 
  Download, 
  Trash2, 
  CheckCircle,
  X,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Notification } from '@/lib/db';

export default function NotificacoesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        const list = db.notifications.filter((n: Notification) => n.user_id === null || n.user_id === user.id);
        list.sort((a: Notification, b: Notification) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotifications(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.notifications = db.notifications.map((n: Notification) => 
          n.id === id ? { ...n, is_read: true } : n
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

  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.notifications = db.notifications.filter((n: Notification) => n.id !== id);
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

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await handleMarkAsRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    const className = theme === 'light' ? 'text-[#5a9200]' : 'text-primary-lemon';
    switch (type) {
      case 'mentoria': return <Calendar size={18} className={className} />;
      case 'masterclass': return <GraduationCap size={18} className={className} />;
      case 'oportunidade': return <TrendingUp size={18} className={className} />;
      case 'recurso': return <Download size={18} className={className} />;
      default: return <Bell size={18} className={className} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
        <div className="flex flex-col gap-3 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit m-0">Notificações</h1>
          <p className="text-text-secondary text-sm m-0 mt-1">Fique atualizado com as atividades da plataforma.</p>
        </div>
        {unreadNotifications.length > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 border border-white/10 text-xs font-bold rounded-lg cursor-pointer hover:bg-white/5 transition-all duration-200"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-panel p-12 text-center text-text-secondary text-sm italic">
          Nenhuma notificação por enquanto.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {unreadNotifications.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-outfit px-1">Novas</h3>
              {unreadNotifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`glass-panel p-5 flex gap-4 items-start border-l-4 transition-all duration-200 cursor-pointer ${
                    theme === 'light' ? 'border-l-[#5a9200] bg-white hover:bg-black/5' : 'border-l-primary-lemon bg-[#12131a] hover:bg-white/5'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white/5 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-sm font-bold text-text-base m-0 font-outfit">{n.title}</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                          className="outline-btn border-0 p-1.5 text-text-secondary hover:text-emerald-400 cursor-pointer"
                          style={{ minWidth: 'auto' }}
                          title="Marcar como lida"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }}
                          className="outline-btn border-0 p-1.5 text-text-secondary hover:text-red-400 cursor-pointer"
                          style={{ minWidth: 'auto' }}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary m-0 mt-1 leading-relaxed">{n.description}</p>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <span className="text-[10px] text-text-muted">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
                      {n.link && (
                        <span 
                          className={`text-[10px] font-bold uppercase tracking-wider no-underline flex items-center gap-1 cursor-pointer transition-colors ${
                            theme === 'light' ? 'text-[#5a9200] hover:text-[#4a7a00]' : 'text-primary-lemon hover:text-white'
                          }`}
                        >
                          <span>Acessar</span>
                          <ArrowRight size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {readNotifications.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-outfit px-1">Anteriores</h3>
              {readNotifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`glass-panel p-5 flex gap-4 items-start opacity-75 hover:opacity-100 transition-opacity duration-200 cursor-pointer ${
                    theme === 'light' ? 'bg-white hover:bg-black/5' : 'bg-[#12131a] hover:bg-white/5'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white/5 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-sm font-bold text-text-base m-0 font-outfit">{n.title}</h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }}
                        className="outline-btn border-0 p-1.5 text-text-secondary hover:text-red-400 cursor-pointer"
                        style={{ minWidth: 'auto' }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary m-0 mt-1 leading-relaxed">{n.description}</p>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <span className="text-[10px] text-text-muted">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
                      {n.link && (
                        <span 
                          className={`text-[10px] font-bold uppercase tracking-wider no-underline flex items-center gap-1 cursor-pointer transition-colors ${
                            theme === 'light' ? 'text-[#5a9200] hover:text-[#4a7a00]' : 'text-primary-lemon hover:text-white'
                          }`}
                        >
                          <span>Acessar</span>
                          <ArrowRight size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
