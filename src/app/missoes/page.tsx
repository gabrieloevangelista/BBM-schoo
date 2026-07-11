'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  ExternalLink, 
  Send,
  FileText
} from 'lucide-react';
import { MissoesSkeleton } from '@/components/SkeletonLoaders';
import { Mission, MissionSubmission } from '@/lib/db';

export default function StudentMissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Accordion active id
  const [activeAccordionId, setActiveAccordionId] = useState<string | null>(null);

  // Form states per mission
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [linkAnswers, setLinkAnswers] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; name: string }>>({});
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const fetchMissionsData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        setMissions(db.missions || []);
        
        // Filter submissions for current user
        const userSubs = (db.mission_submissions || []).filter(
          (s: MissionSubmission) => s.student_id === user?.id
        );
        setSubmissions(userSubs);
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

  const toggleAccordion = (id: string) => {
    setActiveAccordionId(activeAccordionId === id ? null : id);
  };

  // Upload file handler
  const handleFileUpload = async (missionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 100MB
    if (file.size > 100 * 1024 * 1024) {
      alert('O arquivo excede o limite máximo de 100MB.');
      return;
    }

    setUploadingState(prev => ({ ...prev, [missionId]: true }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/missions/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro no upload.');
      }

      setUploadedFiles(prev => ({ 
        ...prev, 
        [missionId]: { url: data.file_url, name: data.file_name } 
      }));
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar upload do arquivo.');
    } finally {
      setUploadingState(prev => ({ ...prev, [missionId]: false }));
    }
  };

  // Submit Mission
  const handleSubmitSubmission = async (mission: Mission) => {
    const textAnswer = textAnswers[mission.id] || '';
    const formLink = linkAnswers[mission.id] || '';
    const file = uploadedFiles[mission.id];

    // Validations
    if (mission.has_text_question && !textAnswer.trim()) {
      alert('Por favor, preencha a resposta textual.');
      return;
    }
    if (mission.has_form_link && !formLink.trim()) {
      alert('Por favor, insira o link do formulário entregue.');
      return;
    }
    if (mission.has_file_upload && !file) {
      alert('Por favor, anexe o arquivo solicitado.');
      return;
    }

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();

        // Check if already approved (extra safety check)
        const existing = db.mission_submissions.find(
          (s: any) => s.mission_id === mission.id && s.student_id === user?.id
        );
        if (existing && existing.status === 'approved') {
          alert('Esta missão já foi aprovada e não pode ser reenviada.');
          return;
        }

        const submissionData = {
          mission_id: mission.id,
          student_id: user?.id || '',
          text_answer: textAnswer,
          form_submitted_link: formLink,
          file_url: file?.url || '',
          file_name: file?.name || ''
        };

        if (existing) {
          // Re-submission: update status to pending and clear feedback
          db.mission_submissions = db.mission_submissions.map((s: any) => {
            if (s.mission_id === mission.id && s.student_id === user?.id) {
              return {
                ...s,
                ...submissionData,
                status: 'pending',
                feedback: '',
                submitted_at: new Date().toISOString(),
                reviewed_at: undefined,
                reviewed_by: undefined
              };
            }
            return s;
          });
        } else {
          // New submission
          const newSub: MissionSubmission = {
            id: `submission-${Date.now()}`,
            ...submissionData,
            status: 'pending',
            submitted_at: new Date().toISOString()
          };
          if (!db.mission_submissions) db.mission_submissions = [];
          db.mission_submissions.push(newSub);
        }

        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        // Clear local inputs
        setTextAnswers(prev => ({ ...prev, [mission.id]: '' }));
        setLinkAnswers(prev => ({ ...prev, [mission.id]: '' }));
        setUploadedFiles(prev => {
          const next = { ...prev };
          delete next[mission.id];
          return next;
        });

        fetchMissionsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Re-enable submission on rejection
  const handleUnlockRejected = (missionId: string, existingSub: MissionSubmission) => {
    setTextAnswers(prev => ({ ...prev, [missionId]: existingSub.text_answer || '' }));
    setLinkAnswers(prev => ({ ...prev, [missionId]: existingSub.form_submitted_link || '' }));
    if (existingSub.file_url) {
      setUploadedFiles(prev => ({
        ...prev,
        [missionId]: { url: existingSub.file_url || '', name: existingSub.file_name || 'arquivo' }
      }));
    }
    // Delete this submission in database to allow fresh submission (or we update local inputs and keep status in DB as rejected until next submit)
    // Actually, simply pre-filling the inputs and leaving the status as 'rejected' works perfectly, 
    // because when they click Submit again, our submit logic will overwrite the database record!
  };

  // Count progress
  const totalM = missions.length;
  const approvedM = submissions.filter(s => s.status === 'approved').length;
  const progressPct = totalM > 0 ? Math.round((approvedM / totalM) * 100) : 0;

  if (isLoading) {
    return <MissoesSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight font-outfit">Missões Práticas</h1>
      <p className="text-text-secondary mt-1">Coloque a teoria em prática e envie seus relatórios e planejamentos para avaliação dos mentores.</p>

      {/* Progress Board */}
      <section className="glass-panel p-6">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2 font-outfit">
            <Trophy size={16} className="text-[#C1FF07]" />
            <span>Desempenho Prático</span>
          </h3>
          <span className="text-primary-lemon font-semibold text-sm">
            {approvedM} de {totalM} concluídas ({progressPct}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-lemon to-primary-lemon-hover rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%` }} 
          />
        </div>
      </section>

      {/* Missions Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {missions.map((mission, idx) => {
          const isOpen = activeAccordionId === mission.id;
          const submission = submissions.find(s => s.mission_id === mission.id);

          let statusBadge = <span className="badge badge-gray">Não Enviada</span>;
          if (submission) {
            if (submission.status === 'approved') {
              statusBadge = <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Aprovada</span>;
            } else if (submission.status === 'rejected') {
              statusBadge = <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Corrigir</span>;
            } else {
              statusBadge = <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Pendente</span>;
            }
          }

          return (
            <div 
              key={mission.id} 
              className="glass-panel" 
              style={{ 
                overflow: 'hidden',
                borderColor: isOpen ? 'var(--color-primary-lemon)' : 'transparent'
              }}
            >
              {/* Accordion Trigger Header */}
              <div 
                onClick={() => toggleAccordion(mission.id)}
                style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  background: isOpen ? 'rgba(255,255,255,0.01)' : 'transparent'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Missão {idx + 1}</span>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{mission.title}</h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {statusBadge}
                  {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>

              {/* Accordion Content Panel */}
              {isOpen && (
                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                    {mission.description}
                  </p>

                  {/* Submission Status Display Box */}
                  {submission && (
                    <div 
                      style={{ 
                        padding: '16px', 
                        borderRadius: '8px', 
                        background: submission.status === 'approved' ? 'rgba(52,211,153,0.05)' : submission.status === 'rejected' ? 'rgba(255,74,74,0.05)' : 'rgba(193,255,7,0.05)',
                        border: '1px solid',
                        borderColor: submission.status === 'approved' ? 'rgba(52,211,153,0.15)' : submission.status === 'rejected' ? 'rgba(255,74,74,0.15)' : 'rgba(193,255,7,0.15)',
                        marginBottom: '24px'
                      }}
                    >
                      <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {submission.status === 'approved' ? 'Entrega Aprovada' : submission.status === 'rejected' ? 'Revisão Necessária' : 'Aguardando Correção'}
                      </h4>

                      {submission.feedback && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                          <strong>Feedback do Mentor:</strong> "{submission.feedback}"
                        </p>
                      )}

                      {submission.status === 'rejected' && (
                        <button 
                          onClick={() => handleUnlockRejected(mission.id, submission)}
                          className="btn-secondary text-xs mt-3" 
                        >
                          Habilitar Campos para Reenvio
                        </button>
                      )}
                    </div>
                  )}

                  {/* Submit Form Area (Hidden if submission is approved or pending and not unlocked) */}
                  {(!submission || submission.status === 'rejected') ? (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        Enviar Minha Entrega
                      </h4>

                      {/* Question Answer */}
                      {mission.has_text_question && (
                        <div className="form-group">
                          <label className="form-label">{mission.text_question || 'Resposta textual obrigatória'} *</label>
                          <textarea 
                            className="form-input" 
                            placeholder="Digite sua resposta detalhada aqui..."
                            value={textAnswers[mission.id] || ''}
                            onChange={e => setTextAnswers(prev => ({ ...prev, [mission.id]: e.target.value }))}
                            style={{ minHeight: '80px', resize: 'vertical' }}
                          />
                        </div>
                      )}

                      {/* Form Link */}
                      {mission.has_form_link && (
                        <div className="form-group">
                          <label className="form-label">Link do Formulário / Planilha Externa *</label>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                              type="url" 
                              className="form-input" 
                              placeholder="https://docs.google.com/..."
                              value={linkAnswers[mission.id] || ''}
                              onChange={e => setLinkAnswers(prev => ({ ...prev, [mission.id]: e.target.value }))}
                            />
                            <a 
                              href={mission.form_link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn-secondary flex items-center justify-center p-3"
                              title="Acessar formulário externo"
                            >
                              <ExternalLink size={18} />
                            </a>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            Clique no botão ao lado para preencher o formulário no site externo, depois cole o link acima.
                          </span>
                        </div>
                      )}

                      {/* File Upload */}
                      {mission.has_file_upload && (
                        <div className="form-group">
                          <label className="form-label">{mission.file_upload_label || 'Anexar Arquivo'} *</label>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <label 
                              className="btn-secondary text-xs cursor-pointer border-dashed"
                            >
                              <Upload size={14} />
                              <span>{uploadingState[mission.id] ? 'Carregando...' : 'Selecionar Arquivo'}</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={e => handleFileUpload(mission.id, e)}
                                disabled={uploadingState[mission.id]}
                              />
                            </label>

                            {uploadedFiles[mission.id] && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                                <FileText size={16} />
                                <span>{uploadedFiles[mission.id].name} (Pronto)</span>
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                            Aceita arquivos de até 100MB.
                          </span>
                        </div>
                      )}

                      <button 
                        onClick={() => handleSubmitSubmission(mission)}
                        className="btn-primary text-xs mt-3"
                      >
                        <Send size={14} />
                        <span>Enviar Missão Técnica</span>
                      </button>
                    </div>
                  ) : (
                    // Display current submitted values for pending/approved
                    <div style={{ fontSize: '0.85rem' }}>
                      <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '12px' }}>Conteúdo da Entrega:</h4>
                      
                      {submission.text_answer && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Resposta Textual:</p>
                          <p style={{ color: '#fff', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '4px' }}>
                            {submission.text_answer}
                          </p>
                        </div>
                      )}

                      {submission.form_submitted_link && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Link do Formulário:</p>
                          <a href={submission.form_submitted_link} target="_blank" rel="noreferrer" style={{ color: '#C1FF07', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}>
                            <span>Acessar Trabalho Enviado</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      {submission.file_url && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Arquivo Anexo:</p>
                          <a href={submission.file_url} download style={{ color: '#C1FF07', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}>
                            <FileText size={14} />
                            <span>{submission.file_name || 'Baixar Arquivo Entregue'}</span>
                          </a>
                        </div>
                      )}

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '16px' }}>
                        Enviado em {new Date(submission.submitted_at).toLocaleDateString('pt-BR')} às {new Date(submission.submitted_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}

        {missions.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhuma missão cadastrada pela equipe pedagógica ainda.
          </div>
        )}
      </div>
    </div>
  );
}
