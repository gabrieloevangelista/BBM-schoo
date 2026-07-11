'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Trash2, ExternalLink } from 'lucide-react';
import { LessonComment, Lesson, Member } from '@/lib/db';
import { AdminSkeleton } from '@/components/SkeletonLoaders';
import { customConfirm } from '@/components/CustomConfirm';

interface CommentWithContext extends LessonComment {
  lesson_title?: string;
}

export default function ComentariosAdminPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        // Map lesson names to comments for context
        const lessons: Record<string, string> = {};
        (db.lessons || []).forEach((l: Lesson) => {
          lessons[l.id] = l.title;
        });

        const lessonComments = (db.lesson_comments || []).map((c: LessonComment) => ({
          ...c,
          lesson_title: lessons[c.lesson_id] || 'Aula Removida ou Desconhecida'
        }));

        // Sort newest first
        lessonComments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setComments(lessonComments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDeleteComment = async (id: string) => {
    const confirmed = await customConfirm(
      'Tem certeza que deseja excluir este comentário permanentemente?',
      'Excluir Comentário'
    );
    if (!confirmed) return;

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        db.lesson_comments = db.lesson_comments.filter((c: LessonComment) => c.id !== id);
        
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });

        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-base flex items-center gap-2">
          Gerenciamento de Comentários
        </h2>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '10px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Nenhum comentário encontrado nas aulas.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(193, 255, 7, 0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <th style={{ padding: '15px 12px' }}>Usuário</th>
                <th style={{ padding: '15px 12px' }}>Comentário</th>
                <th style={{ padding: '15px 12px' }}>Aula (Contexto)</th>
                <th style={{ padding: '15px 12px' }}>Data</th>
                <th style={{ padding: '15px 12px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr 
                  key={comment.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <td style={{ padding: '15px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {comment.user_avatar ? (
                        <img src={comment.user_avatar} alt={comment.user_name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(193, 255, 7, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C1FF07', fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {comment.user_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p style={{ color: 'var(--color-text-base)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{comment.user_name}</p>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '15px 12px', maxWidth: '300px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {comment.content}
                    </p>
                  </td>

                  <td style={{ padding: '15px 12px' }}>
                    <p style={{ color: 'var(--color-text-base)', fontSize: '0.8rem', margin: 0 }}>{comment.lesson_title}</p>
                  </td>

                  <td style={{ padding: '15px 12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteComment(comment.id)} 
                      className="outline-btn p-2 border-0 text-red-500 hover:text-red-400" 
                      style={{ minWidth: 'auto' }} 
                      title="Excluir Comentário"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
