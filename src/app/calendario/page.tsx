'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CalendarioSkeleton } from '@/components/SkeletonLoaders';
import { 
  Calendar as CalendarIcon, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Video, 
  Clock, 
  User,
  X,
  RefreshCw,
  Link as LinkIcon,
  Edit2
} from 'lucide-react';
import { customAlert, customConfirm } from '@/components/CustomConfirm';
import { CalendarEvent } from '@/lib/db';

export default function CalendarioPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'mentoria'>('all');
  const [currentDate, setCurrentDate] = useState(new Date()); // Controls month shown
  const [isLoading, setIsLoading] = useState(true);

  // Sync animation state
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    const formattedDay = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
    const formattedMonth = (today.getMonth() + 1) < 10 ? `0${today.getMonth() + 1}` : (today.getMonth() + 1);
    return `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
  });
  const [newTitle, setNewTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'mentoria' | 'atualizacao'>('mentoria');
  const [newStartTime, setNewStartTime] = useState('19:00');
  const [newEndTime, setNewEndTime] = useState('20:00');
  const [newTopic, setNewTopic] = useState('');
  const [newZoomLink, setNewZoomLink] = useState('https://zoom.us/j/123456');

  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setEvents(db.calendar_events || []);
      }
    } catch (e) {
      console.error('Error fetching calendar events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Google Calendar Link generator
  const getGoogleCalendarUrl = (event: CalendarEvent) => {
    // Dates format: YYYYMMDDTHHMMSS
    // e.g. event_date: "2026-07-15", start_time: "19:00:00" -> "20260715T190000"
    const datePart = event.event_date.replace(/-/g, '');
    const startPart = event.start_time.replace(/:/g, '').substring(0, 4) + '00';
    const endPart = event.end_time.replace(/:/g, '').substring(0, 4) + '00';

    const startISO = `${datePart}T${startPart}`;
    const endISO = `${datePart}T${endPart}`;
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(`Tópico: ${event.topic || ''}\nMentor: ${event.mentor_name || ''}\nLink do Encontro: ${event.zoom_link || ''}`);
    const location = encodeURIComponent(event.zoom_link || 'Zoom Meeting');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startISO}/${endISO}&details=${details}&location=${location}&ctz=America/Sao_Paulo`;
  };

  // Google account sync simulator
  const handleGoogleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setToastMsg('Agenda sincronizada com sucesso com a sua conta Google!');
      setTimeout(() => setToastMsg(''), 4000);
    }, 1500);
  };

  // Add or Edit Event handler
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedDateStr || !newStartTime || !newEndTime) {
      customAlert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        if (editingEventId) {
          // Edit existing event
          db.calendar_events = db.calendar_events.map((ev: CalendarEvent) => {
            if (ev.id === editingEventId) {
              return {
                ...ev,
                title: newTitle,
                event_type: newEventType,
                event_date: selectedDateStr,
                start_time: newStartTime.length === 5 ? newStartTime + ':00' : newStartTime,
                end_time: newEndTime.length === 5 ? newEndTime + ':00' : newEndTime,
                topic: newTopic,
                zoom_link: newZoomLink
              };
            }
            return ev;
          });
        } else {
          // Create new event
          const newEventId = `event-${Date.now()}`;
          const newEvent: CalendarEvent = {
            id: newEventId,
            title: newTitle,
            event_type: newEventType,
            event_date: selectedDateStr,
            start_time: newStartTime + ':00',
            end_time: newEndTime + ':00',
            mentor_name: user?.name || 'Gabriel Evangelista',
            mentor_role: user?.role || 'CEO & Fundador',
            mentor_avatar: user?.img || '',
            topic: newTopic,
            zoom_link: newZoomLink,
            created_at: new Date().toISOString()
          };

          db.calendar_events.push(newEvent);

          // Add associated global notification
          const notification = {
            id: `notification-${Date.now()}`,
            user_id: null,
            title: 'Novo Encontro Agendado',
            description: `${newTitle} foi marcado para dia ${selectedDateStr.split('-').reverse().join('/')} às ${newStartTime}.`,
            type: newEventType,
            link: '/calendario',
            is_read: false,
            created_at: new Date().toISOString()
          };
          db.notifications.unshift(notification);
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // Reset
        setEditingEventId(null);
        setNewTitle('');
        setNewTopic('');
        setShowAddModal(false);
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete event
  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.calendar_events = db.calendar_events.filter((e: CalendarEvent) => e.id !== deletingEventId);
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setDeletingEventId(null);
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar math functions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const startDayOfWeek = getFirstDayOfWeek(year, month); // 0 (Sun) to 6 (Sat)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Date cell click
  const handleDayClick = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : (month + 1);
    setSelectedDateStr(`${year}-${formattedMonth}-${formattedDay}`);
  };

  const filteredEvents = events.filter(e => {
    const matchesFilter = filterType === 'all' || e.event_type === filterType;
    return matchesFilter;
  });

  const getEventsForDay = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : (month + 1);
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return filteredEvents.filter(e => e.event_date === dateStr);
  };

  const canManage = user?.member_type === 'admin' || user?.member_type === 'mentor';

  if (isLoading) {
    return <CalendarioSkeleton />;
  }

  const getSelectedDateFriendlyLabel = () => {
    if (!selectedDateStr) return '';
    const parts = selectedDateStr.split('-');
    const day = parseInt(parts[2]);
    const monthIndex = parseInt(parts[1]) - 1;
    return `DIA ${day} DE ${monthNames[monthIndex].toUpperCase()}`;
  };

  const selectedDayEvents = events.filter(e => e.event_date === selectedDateStr && (filterType === 'all' || e.event_type === filterType));

  return (
    <div style={{ position: 'relative' }} className="flex flex-col gap-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div 
          className="glass-panel"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            border: '1px solid var(--accent-green)',
            background: 'rgba(52, 211, 153, 0.1)',
            color: '#34D399',
            borderRadius: '8px',
            zIndex: 9999,
            fontSize: '0.85rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Page Title */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit m-0">Calendário de Mentorias</h1>
          <p className="text-text-secondary text-sm m-0 mt-1">Fuso Horário: Brasília (GMT-3). Agende suas mentorias e adicione-as ao seu dia a dia.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleGoogleSync} 
            className="outline-btn text-xs py-2 px-3" 
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>Sincronizar Google</span>
          </button>
          
          {canManage && (
            <button 
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                setSelectedDateStr(todayStr);
                setEditingEventId(null);
                setNewTitle('');
                setNewTopic('');
                setNewZoomLink('');
                setNewStartTime('19:00');
                setNewEndTime('20:00');
                setShowAddModal(true);
              }} 
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Novo Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Toggles */}
      <div className="flex justify-between items-center border-b border-[var(--color-glass-border)] pb-4 mb-2 flex-wrap gap-4">
        {/* Type Filter Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterType('all')} 
            className={`px-3 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
              filterType === 'all' 
                ? 'bg-primary-lemon/10 text-primary-lemon border-primary-lemon/30' 
                : 'border-transparent text-text-secondary hover:text-text-base'
            }`}
            style={{ background: filterType === 'all' ? undefined : 'transparent' }}
          >
            Todos os Eventos
          </button>
          <button 
            onClick={() => setFilterType('mentoria')} 
            className={`px-3 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
              filterType === 'mentoria' 
                ? 'bg-primary-lemon/10 text-primary-lemon border-primary-lemon/30' 
                : 'border-transparent text-text-secondary hover:text-text-base'
            }`}
            style={{ background: filterType === 'mentoria' ? undefined : 'transparent' }}
          >
            Mentorias
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border border-white/10 rounded-[4px] p-1 bg-white/2">
          <button 
            onClick={() => setViewMode('grid')}
            className="p-1.5 rounded-[2px] cursor-pointer transition-all duration-200 flex items-center justify-center"
            style={{ 
              border: 'none', 
              backgroundColor: viewMode === 'grid' ? 'var(--color-primary-lemon)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--color-switch-active-text)' : 'var(--text-secondary)'
            }}
            title="Grade"
          >
            <CalendarIcon size={14} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className="p-1.5 rounded-[2px] cursor-pointer transition-all duration-200 flex items-center justify-center"
            style={{ 
              border: 'none', 
              backgroundColor: viewMode === 'list' ? 'var(--color-primary-lemon)' : 'transparent',
              color: viewMode === 'list' ? 'var(--color-switch-active-text)' : 'var(--text-secondary)'
            }}
            title="Lista"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Calendar Grid / List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {viewMode === 'grid' && (
            <div className="glass-panel p-6">
              {/* Calendar header with Month Name and Navigation */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-text-base font-outfit uppercase tracking-wider">
                  {monthNames[month]} {year}
                </h3>
                <div className="flex gap-2">
                  <button onClick={handlePrevMonth} className="outline-btn p-1.5" style={{ minWidth: 'auto' }}>
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={handleNextMonth} className="outline-btn p-1.5" style={{ minWidth: 'auto' }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <span key={day} className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{day}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="bg-transparent border border-transparent" />
                ))}

                {Array.from({ length: totalDays }).map((_, idx) => {
                  const day = idx + 1;
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDateStr === `${year}-${(month+1)<10?`0${month+1}`:(month+1)}-${day<10?`0${day}`:day}`;

                  return (
                    <div 
                      key={`day-${day}`}
                      onClick={() => handleDayClick(day)}
                      className={`glass-panel p-2 flex flex-col min-h-[64px] cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#C1FF07] bg-[#C1FF07]/5 shadow-[0_0_12px_rgba(193,255,7,0.08)]' 
                          : 'hover:bg-white/5 border-white/5 bg-white/1'
                      }`}
                      style={{ border: isSelected ? '1px solid #C1FF07' : '1px solid rgba(193, 255, 7, 0.08)' }}
                    >
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-[#C1FF07]' : 'text-text-secondary'}`}>
                        {day}
                      </span>

                      <div className="flex flex-col gap-1 mt-1.5">
                        {dayEvents.map(e => (
                          <div 
                            key={e.id}
                            className={`text-[8px] px-1.5 py-0.5 rounded truncate ${
                              e.event_type === 'mentoria' 
                                ? 'bg-[#C1FF07]/10 border-l border-[#C1FF07] text-text-base' 
                                : 'bg-[#34D399]/10 border-l border-[#34D399] text-text-base'
                            }`}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="flex flex-col gap-4">
              {filteredEvents.length === 0 ? (
                <div className="glass-panel p-8 text-center text-text-secondary text-sm italic">
                  Nenhum compromisso agendado para o filtro selecionado.
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div key={event.id} className="glass-panel p-5 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex gap-4 items-start flex-grow">
                      <div className="w-14 h-14 rounded-xl bg-[#C1FF07]/10 border border-[#C1FF07]/25 text-[#C1FF07] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold leading-none">{event.event_date.split('-')[2]}</span>
                        <span className="text-[8px] uppercase font-bold mt-1">{monthNames[parseInt(event.event_date.split('-')[1]) - 1].substring(0, 3)}</span>
                      </div>
                      <div>
                        <span className={`badge text-[9px] uppercase font-bold mb-1.5 ${event.event_type === 'mentoria' ? 'badge-gold' : 'badge-green'}`}>
                          {event.event_type === 'mentoria' ? 'Mentoria Coletiva' : 'Atualização'}
                        </span>
                        <h3 className="text-sm font-bold text-text-base m-0 font-outfit">{event.title}</h3>
                        <p className="text-[11px] text-text-secondary m-0 mt-1">Pauta: {event.topic}</p>
                        <div className="flex gap-4 items-center mt-2.5 text-[10px] text-text-muted">
                          <span className="flex items-center gap-1"><Clock size={12} /> {event.start_time.substring(0,5)} às {event.end_time.substring(0,5)}</span>
                          {event.mentor_name && <span className="flex items-center gap-1"><User size={12} /> {event.mentor_name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      {event.zoom_link && (
                        <a href={event.zoom_link} target="_blank" rel="noreferrer" className="outline-btn text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 flex items-center gap-1" style={{ textDecoration: 'none' }}>
                          <Video size={12} />
                          <span>Link do Encontro</span>
                        </a>
                      )}
                      <a href={getGoogleCalendarUrl(event)} target="_blank" rel="noreferrer" className="outline-btn text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 flex items-center gap-1" style={{ textDecoration: 'none' }}>
                        <ExternalLink size={12} />
                        <span>Google Agenda</span>
                      </a>
                      {canManage && (
                        <div className="flex items-center">
                          <button 
                            onClick={() => {
                              setEditingEventId(event.id);
                              setNewTitle(event.title);
                              setNewEventType(event.event_type as 'mentoria' | 'atualizacao');
                              setSelectedDateStr(event.event_date);
                              setNewStartTime(event.start_time.substring(0, 5));
                              setNewEndTime(event.end_time.substring(0, 5));
                              setNewTopic(event.topic || '');
                              setNewZoomLink(event.zoom_link || '');
                              setShowAddModal(true);
                            }} 
                            className="outline-btn border-0 text-text-secondary hover:text-text-base p-1.5 cursor-pointer" 
                            style={{ minWidth: 'auto' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeletingEventId(event.id)} className="outline-btn border-0 text-red-500 hover:text-red-400 p-1.5 cursor-pointer" style={{ minWidth: 'auto' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: Selected day agenda & Requisitos */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Selected Day Agenda */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text-secondary font-outfit m-0 uppercase tracking-wider">
              {getSelectedDateFriendlyLabel()}
            </h3>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-xs font-medium">
                Nenhum evento agendado para este dia.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedDayEvents.map(event => (
                  <div key={event.id} className="p-4 bg-white/2 border border-white/5 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`badge text-[9px] uppercase font-bold ${event.event_type === 'mentoria' ? 'badge-gold' : 'badge-green'}`}>
                        {event.event_type === 'mentoria' ? 'Mentoria' : 'Atualização'}
                      </span>
                      {canManage && (
                        <div className="flex items-center">
                          <button 
                            onClick={() => {
                              setEditingEventId(event.id);
                              setNewTitle(event.title);
                              setNewEventType(event.event_type as 'mentoria' | 'atualizacao');
                              setSelectedDateStr(event.event_date);
                              setNewStartTime(event.start_time.substring(0, 5));
                              setNewEndTime(event.end_time.substring(0, 5));
                              setNewTopic(event.topic || '');
                              setNewZoomLink(event.zoom_link || '');
                              setShowAddModal(true);
                            }}
                            className="outline-btn border-0 p-0 text-text-secondary hover:text-text-base cursor-pointer mr-2"
                            style={{ minWidth: 'auto' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => setDeletingEventId(event.id)}
                            className="outline-btn border-0 p-0 text-red-500 hover:text-red-400 cursor-pointer"
                            style={{ minWidth: 'auto' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-text-base font-outfit m-0 leading-snug">{event.title}</h4>
                    <p className="text-[10px] text-text-secondary m-0 leading-relaxed">Tema: {event.topic}</p>
                    <div className="flex items-center justify-between text-[9px] text-text-muted mt-2 border-t border-white/5 pt-2 flex-wrap gap-2">
                      <span className="flex items-center gap-1"><Clock size={10} /> {event.start_time.substring(0, 5)} às {event.end_time.substring(0, 5)}</span>
                      {event.zoom_link && (
                        <a href={event.zoom_link} target="_blank" rel="noreferrer" className="text-primary-lemon hover:underline font-bold" style={{ textDecoration: 'none' }}>Acessar Link</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REQUISITOS Panel */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text-base font-outfit m-0 uppercase tracking-wider">Requisitos</h3>
            <ul className="flex flex-col gap-3 p-0 m-0 list-none text-[11px] text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-[#C1FF07] mt-0.5">•</span>
                <span>Mantenha sua câmera ligada durante as discussões de mentoria.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1FF07] mt-0.5">•</span>
                <span>As gravações estarão na biblioteca de Masterclasses em até 24 horas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1FF07] mt-0.5">•</span>
                <span>Dúvidas específicas podem ser enviadas por e-mail antes do início da sessão.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingEventId && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="modal-card"
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '30px',
              textAlign: 'center',
              border: '1px solid rgba(255, 74, 74, 0.5)'
            }}
          >
            <div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(255, 74, 74, 0.1)',
                color: '#FF4A4A',
                border: '1px solid #FF4A4A',
                margin: '0 auto 16px auto'
              }}
              className="flex-center"
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-base)', marginBottom: '8px' }}>Excluir Evento?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Tem certeza que deseja remover este compromisso do calendário? Mentorados receberão um aviso.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setDeletingEventId(null)} className="outline-btn text-xs" style={{ padding: '8px 16px' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteEvent} className="gold-glow-btn text-xs" style={{ padding: '8px 16px', background: '#FF4A4A', boxShadow: 'none' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="modal-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '30px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-base)' }}>
                {editingEventId ? 'Editar Evento' : 'Agendar Novo Encontro'}
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setEditingEventId(null); }}
                className="outline-btn border-0 p-1 text-gray-400 hover:text-text-base"
                style={{ minWidth: 'auto' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label className="form-label">Título do Evento *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Mentoria Individual de Viabilidade"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>


              <div className="form-group">
                <label className="form-label">Data Agendada *</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Horário Inicial *</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Horário Final *</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pauta / Tópico</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Resumo do assunto que será abordado"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link de Transmissão (Zoom/Meet)</label>
                <input 
                  type="url" 
                  className="form-input"
                  value={newZoomLink}
                  onChange={(e) => setNewZoomLink(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="gold-glow-btn w-full" 
                style={{ padding: '12px', marginTop: '10px', width: '100%' }}
              >
                {editingEventId ? 'Salvar Alterações' : 'Criar Evento no Calendário'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
