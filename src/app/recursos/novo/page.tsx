'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Check, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import { customAlert } from '@/components/CustomConfirm';
import { Lesson, Resource } from '@/lib/db';

export default function NovoRecursoPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [availableAt, setAvailableAt] = useState('');
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<string>('');
  const [conversionType, setConversionType] = useState<string>('');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const db = await response.json();
          setLessons(db.lessons || []);
        }
      } catch (error) {
        console.error('Error loading lessons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      if (user.member_type !== 'admin') {
        router.push('/recursos');
      } else {
        fetchLessons();
      }
    }
  }, [user]);

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const compressAndConvertToAvif = async (file: File): Promise<{ blob: Blob; type: string }> => {
    if (!file.type.startsWith('image/')) {
      return { blob: file, type: 'original' };
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ blob: file, type: 'original' });
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try AVIF first
          canvas.toBlob((blob) => {
            if (blob && blob.size < file.size) {
              resolve({ blob, type: 'AVIF' });
            } else {
              // Fallback to WebP
              canvas.toBlob((webpBlob) => {
                if (webpBlob && webpBlob.size < file.size) {
                  resolve({ blob: webpBlob, type: 'WebP' });
                } else {
                  resolve({ blob: file, type: 'original' });
                }
              }, 'image/webp', 0.7);
            }
          }, 'image/avif', 0.65);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOriginalSize((file.size / 1024).toFixed(1) + ' KB');
    
    if (file.type.startsWith('image/')) {
      setConversionType('Processando...');
      const { blob, type } = await compressAndConvertToAvif(file);
      const base64 = await fileToBase64(blob);
      setFileBase64(base64);
      setCompressedSize((blob.size / 1024).toFixed(1) + ' KB');
      setConversionType(type);
    } else {
      const base64 = await fileToBase64(file);
      setFileBase64(base64);
      setCompressedSize((file.size / 1024).toFixed(1) + ' KB');
      setConversionType('original');
    }
  };

  const detectCategoryAndFormat = (fileName: string, mimeType: string): { category: 'spreadsheet' | 'document' | 'presentation' | 'other'; format: string } => {
    const parts = fileName.split('.');
    const ext = parts[parts.length - 1].toLowerCase();

    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { category: 'spreadsheet', format: ext };
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext) || mimeType.startsWith('image/')) {
      return { category: 'document', format: ext };
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return { category: 'presentation', format: ext };
    }
    return { category: 'other', format: ext };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileBase64 || !lessonId) {
      customAlert('Por favor, preencha todos os campos obrigatórios e anexe um arquivo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db = await response.json();
        
        const fileName = selectedFile?.name || 'arquivo';
        const mimeType = selectedFile?.type || '';
        const { category, format } = detectCategoryAndFormat(fileName, mimeType);

        // For converted AVIF/WebP, update the format accordingly if it's an image
        let finalFormat = format.toUpperCase();
        if (conversionType === 'AVIF') finalFormat = 'AVIF';
        if (conversionType === 'WebP') finalFormat = 'WEBP';

        const newRes: Resource = {
          id: `resource-${Date.now()}`,
          lesson_id: lessonId,
          title,
          category,
          description,
          file_url: fileBase64,
          format: finalFormat,
          size: compressedSize,
          created_at: new Date().toISOString()
        };

        if (availableAt) {
          newRes.available_at = new Date(availableAt).toISOString();
        }

        if (!db.resources) db.resources = [];
        db.resources.push(newRes);

        // Notify users
        const now = new Date();
        const isAvailableNow = !availableAt || new Date(availableAt) <= now;
        if (isAvailableNow) {
          const notification = {
            id: `notification-${Date.now()}`,
            user_id: null,
            title: 'Novo Recurso Liberado',
            description: `O arquivo "${title}" foi adicionado à central de recursos.`,
            type: 'recurso',
            link: '/recursos',
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

        router.push('/recursos');
      }
    } catch (error) {
      console.error(error);
      customAlert('Erro ao cadastrar recurso. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto mt-10">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/recursos"
          className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold font-outfit m-0">Adicionar Recurso</h1>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Título do Recurso *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Planilha de Custos Operacionais"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea 
              className="form-input min-h-[80px]" 
              placeholder="Breve descrição sobre o arquivo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anexo (Arquivo/Imagem) *</label>
            <div className="flex flex-col gap-3">
              <label className="border border-[var(--color-input-border)] border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-[#0a0a0f] hover:bg-white/[0.02] cursor-pointer transition-colors text-center">
                <Upload size={24} className="text-text-muted mb-2" />
                <span className="text-xs font-semibold text-text-base">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo'}
                </span>
                <span className="text-[10px] text-text-muted mt-1">
                  Imagens serão convertidas para AVIF automaticamente.
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </label>

              {/* File Info and Compression Report */}
              {selectedFile && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Tamanho Original:</span>
                    <span className="font-semibold text-white">{originalSize}</span>
                  </div>
                  {conversionType && conversionType !== 'original' && conversionType !== 'Processando...' && (
                    <div className="flex justify-between items-center text-text-secondary">
                      <span>Formato Otimizado ({conversionType}):</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> {compressedSize}
                      </span>
                    </div>
                  )}
                  {conversionType === 'Processando...' && (
                    <span className="text-[10px] text-[#C1FF07] animate-pulse">Convertendo e otimizando para AVIF...</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vincular à Aula *</label>
            <CustomSelect
              value={lessonId}
              onChange={(val) => setLessonId(val)}
              options={[
                { value: '', label: 'Selecione uma aula...' },
                ...lessons.map(les => ({ value: les.id, label: les.title }))
              ]}
              className="w-full text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Agendar Liberação (Opcional)</label>
            <input 
              type="datetime-local" 
              className="form-input"
              value={availableAt}
              onChange={(e) => setAvailableAt(e.target.value)}
              disabled={isSubmitting}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Deixe em branco para liberação imediata.
            </span>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full mt-2"
            disabled={isSubmitting || conversionType === 'Processando...'}
          >
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar Recurso'}
          </button>
        </form>
      </div>
    </div>
  );
}
