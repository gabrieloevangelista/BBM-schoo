'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  X,
  Save,
  FileText,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Link as LinkIcon,
  Folder
} from 'lucide-react';
import { customConfirm } from '@/components/CustomConfirm';
import { Mission, MissionSubmission, Member } from '@/lib/db';
import { AdminSkeleton } from '@/components/SkeletonLoaders';

export default function MissoesAdminPage() {
  const { user } = useAuth();
  
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gerenciar' | 'correcoes'>('correcoes');

  // Creation Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasTextQuestion, setHasTextQuestion] = useState(false);
  const [textQuestion, setTextQuestion] = useState('');
  const [hasFormLink, setHasFormLink] = useState(false);
  const [formLink, setFormLink] = useState('');
  const [hasFileUpload, setHasFileUpload] = useState(false);
  const [fileUploadLabel, setFileUploadLabel] = useState('');

  // Correction Drawer states
  const [selectedSubForReview, setSelectedSubForReview] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const fetchMissionsData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setMissions(db.missions || []);
        setMembers(db.members || []);

        // Hydrate submissions with student profile details and mission titles
        const list = (db.mission_submissions || []).map((sub: MissionSubmission) => {
          const student = db.members.find((m: Member) => m.id === sub.student_id);
          const mission = db.missions.find((m: Mission) => m.id === sub.mission_id);
          return {
            ...sub,
            student_name: student ? student.name : 'Estudante',
            student_avatar: student ? student.img : '',
            student_initials: student ? student.initials : 'ES',
            mission_title: mission ? mission.title : 'Missão Removida'
          };
        });
        
        // Sort chronologically (latest submitted first)
        list.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        setSubmissions(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMissionsData();
    }
  }, [user]);

  // Create new mission task
  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const newMission: Mission = {
          id: `mission-uuid-${Date.now()}`,
          title,
          description,
          has_text_question: hasTextQuestion,
          text_question: hasTextQuestion ? textQuestion : undefined,
          has_form_link: hasFormLink,
          form_link: hasFormLink ? formLink : undefined,
          has_file_upload: hasFileUpload,
          file_upload_label: hasFileUpload ? fileUploadLabel : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (!db.missions) db.missions = [];
        db.missions.push(newMission);

        // Notify all members of a new mission
        const notification = {
          id: `notification-${Date.now()}`,
          user_id: null,
          title: 'Nova Missão Prática!',
          description: `A tarefa "${title}" já está disponível para envio.`,
          type: 'masterclass',
          link: '/missoes',
          is_read: false,
          created_at: new Date().toISOString()
        };
        db.notifications.unshift(notification);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // Reset
        setTitle('');
        setDescription('');
        setHasTextQuestion(false);
        setTextQuestion('');
        setHasFormLink(false);
        setFormLink('');
        setHasFileUpload(false);
        setFileUploadLabel('');
        setShowAddModal(false);
        fetchMissionsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete mission
  const handleDeleteMission = async (id: string) => {
    const confirmed = await customConfirm(
      'Deseja excluir esta missão permanentemente? Todas as entregas dos alunos serão perdidas.',
      'Excluir Missão Prática'
    );
    if (!confirmed) return;
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.missions = db.missions.filter((m: Mission) => m.id !== id);
        
        // Also delete submissions associated with it
        db.mission_submissions = db.mission_submissions.filter((s: MissionSubmission) => s.mission_id !== id);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchMissionsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Submission Review (Correção)
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForReview) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        db.mission_submissions = db.mission_submissions.map((s: MissionSubmission) => {
          if (s.id === selectedSubForReview.id) {
            return {
              ...s,
              status: reviewStatus,
              feedback: reviewFeedback,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.id
            };
          }
          return s;
        });

        // Notify student about review outcome
        const notification = {
          id: `notification-${Date.now()}`,
          user_id: selectedSubForReview.student_id,
          title: reviewStatus === 'approved' ? 'Missão Aprovada!' : 'Ajustes Solicitados na Missão',
          description: `Sua entrega para "${selectedSubForReview.mission_title}" foi avaliada por ${user?.name}.`,
          type: 'masterclass',
          link: '/missoes',
          is_read: false,
          created_at: new Date().toISOString()
        };
        db.notifications.unshift(notification);

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        setSelectedSubForReview(null);
        setReviewFeedback('');
        fetchMissionsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <AdminSkeleton />;
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const correctedSubmissions = submissions.filter(s => s.status !== 'pending');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Painel de Missões</h1>
        
        <button onClick={() => setShowAddModal(true)} className="gold-glow-btn text-xs" style={{ padding: '10px 16px' }}>
          <Plus size={16} />
          <span>Criar Missão</span>
        </button>
      </div>
      <p className="page-subtitle">Acesso restrito para administradores. Crie enunciados de tarefas e avalie entregas de mentorados.</p>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(193, 255, 7, 0.1)', marginBottom: '24px', gap: '20px' }}>
        <button 
          onClick={() => setActiveTab('correcoes')} 
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'correcoes' ? '2px solid #C1FF07' : 'none',
            color: activeTab === 'correcoes' ? '#C1FF07' : 'var(--text-secondary)',
            padding: '10px 5px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            fontFamily: 'var(--font-outfit)'
          }}
        >
          Correções Hub ({pendingSubmissions.length} pendentes)
        </button>
        <button 
          onClick={() => setActiveTab('gerenciar')} 
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'gerenciar' ? '2px solid #C1FF07' : 'none',
            color: activeTab === 'gerenciar' ? '#C1FF07' : 'var(--text-secondary)',
            padding: '10px 5px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            fontFamily: 'var(--font-outfit)'
          }}
        >
          Enunciados cadastrados ({missions.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* Tab 1: Correcoes (Corrections Hub) */}
        {activeTab === 'correcoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Pending Section */}
            <div>
              <h3 style={{ color: '#C1FF07', fontSize: '1.05rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Entregas Pendentes de Avaliação ({pendingSubmissions.length})
              </h3>

              {pendingSubmissions.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Nenhuma entrega pendente de correção. Bom trabalho!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {pendingSubmissions.map(sub => (
                    <div 
                      key={sub.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '20px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {sub.student_avatar ? (
                          <img src={sub.student_avatar} alt={sub.student_name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#C1FF07', border: '1px solid #C1FF07' }} className="flex-center font-bold text-xs">
                            {sub.student_initials}
                          </div>
                        )}
                        <div>
                          <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{sub.student_name}</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                            Missão: <strong>{sub.mission_title}</strong>
                          </p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Enviado em: {new Date(sub.submitted_at).toLocaleDateString('pt-BR')} às {new Date(sub.submitted_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedSubForReview(sub);
                          setReviewStatus('approved');
                          setReviewFeedback('');
                        }}
                        className="gold-glow-btn text-xs" 
                        style={{ padding: '8px 14px' }}
                      >
                        Avaliar Trabalho
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Corrected Section */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Histórico de Correções Feitas
              </h3>

              {correctedSubmissions.length === 0 ? (
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Nenhuma correção no histórico ainda.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {correctedSubmissions.map(sub => (
                    <div 
                      key={sub.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '16px 20px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        opacity: 0.8
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{sub.student_name}</span>
                          <span className={`badge ${sub.status === 'approved' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                            {sub.status === 'approved' ? 'Aprovada' : 'Corrigir'}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                          Missão: {sub.mission_title}
                        </p>
                        {sub.feedback && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>
                            Feedback: "{sub.feedback}"
                          </p>
                        )}
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedSubForReview(sub);
                          setReviewStatus(sub.status);
                          setReviewFeedback(sub.feedback || '');
                        }}
                        className="outline-btn text-xs" 
                        style={{ padding: '6px 12px' }}
                      >
                        Reavaliar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Gerenciar (Missions Manager) */}
        {activeTab === 'gerenciar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {missions.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nenhuma missão enunciada cadastrada no banco.
              </div>
            ) : (
              missions.map((m, idx) => (
                <div key={m.id} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-lemon)', fontWeight: 600 }}>Enunciado {idx + 1}</span>
                      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2px' }}>{m.title}</h3>
                    </div>
                    <button onClick={() => handleDeleteMission(m.id)} className="outline-btn p-2 border-0 text-red-500 hover:text-red-400" style={{ minWidth: 'auto' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>
                    {m.description}
                  </p>

                  {/* Requirements List */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {m.has_text_question && (
                      <span className="badge badge-gray flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                        <HelpCircle size={12} /> Pergunta Textual: "{m.text_question}"
                      </span>
                    )}
                    {m.has_form_link && (
                      <span className="badge badge-gray flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                        <LinkIcon size={12} /> Link Externo: {m.form_link}
                      </span>
                    )}
                    {m.has_file_upload && (
                      <span className="badge badge-gray flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                        <Folder size={12} /> Upload Anexo: "{m.file_upload_label}"
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Review Dialog Overlay drawer */}
      {selectedSubForReview && (
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
            className="glass-panel"
            style={{
              maxWidth: '550px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '30px',
              border: '1px solid var(--color-primary-lemon)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', fontFamily: 'var(--font-outfit)' }}>
                Avaliação de Entrega
              </h3>
              <button 
                onClick={() => setSelectedSubForReview(null)}
                className="outline-btn border-0 p-1 text-gray-400 hover:text-white"
                style={{ minWidth: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aluno:</p>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{selectedSubForReview.student_name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Missão:</p>
              <p style={{ color: 'var(--color-primary-lemon)', fontWeight: 600, fontSize: '0.9rem' }}>{selectedSubForReview.mission_title}</p>
            </div>

            {/* Student Answers display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {selectedSubForReview.text_answer && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resposta Escrita:</p>
                  <p style={{ fontSize: '0.85rem', color: '#fff', background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', marginTop: '4px', lineHeight: 1.5 }}>
                    {selectedSubForReview.text_answer}
                  </p>
                </div>
              )}

              {selectedSubForReview.form_submitted_link && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Link do Trabalho:</p>
                  <a href={selectedSubForReview.form_submitted_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#C1FF07', textDecoration: 'none', fontSize: '0.85rem', marginTop: '4px' }}>
                    <span>Acessar Link Externo</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {selectedSubForReview.file_url && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arquivo Enviado:</p>
                  <a href={selectedSubForReview.file_url} download className="outline-btn text-xs" style={{ padding: '8px 12px', marginTop: '6px', textDecoration: 'none' }}>
                    <FileText size={14} />
                    <span>{selectedSubForReview.file_name || 'Baixar Arquivo'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Assessment Editor Form */}
            <form onSubmit={handleSaveReview} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Resultado do Julgamento *</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="approved" 
                      checked={reviewStatus === 'approved'} 
                      onChange={() => setReviewStatus('approved')}
                      style={{ accentColor: 'var(--color-primary-lemon)' }}
                    />
                    <span className="text-green-400 flex-center gap-1"><CheckCircle size={14} /> Aprovado / Concluído</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="rejected" 
                      checked={reviewStatus === 'rejected'} 
                      onChange={() => setReviewStatus('rejected')}
                      style={{ accentColor: 'var(--color-primary-lemon)' }}
                    />
                    <span className="text-red-400 flex-center gap-1"><XCircle size={14} /> Recusar (Solicitar Correção)</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Feedback escrito / Justificativa *</label>
                <textarea 
                  className="form-input" 
                  placeholder="Escreva orientações de melhoria ou parabenize o aluno..."
                  value={reviewFeedback}
                  onChange={e => setReviewFeedback(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="gold-glow-btn w-full" 
                style={{ padding: '12px', marginTop: '10px', width: '100%' }}
              >
                <Save size={16} />
                <span>Salvar Avaliação</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
