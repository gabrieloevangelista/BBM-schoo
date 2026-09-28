'use client';

import React, { useState, useRef } from 'react';
import { Video, Upload, CheckCircle2, AlertCircle, Loader2, Play, Trash2 } from 'lucide-react';

interface LessonVideoUploaderProps {
  currentVideoUrl?: string;
  currentPlaybackId?: string;
  currentDuration?: string;
  onUploadSuccess: (data: {
    streamUrl: string;
    playbackId: string;
    durationFormatted?: string;
    thumbnailUrl?: string;
  }) => void;
  onRemoveVideo?: () => void;
}

export function LessonVideoUploader({
  currentVideoUrl,
  currentPlaybackId,
  currentDuration,
  onUploadSuccess,
  onRemoveVideo,
}: LessonVideoUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSizeText, setFileSizeText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setStatus('error');
      setErrorMessage('Por favor, selecione um arquivo de vídeo válido (MP4, MOV, MKV, etc).');
      return;
    }

    setFileName(file.name);
    setFileSizeText(formatFileSize(file.size));
    setStatus('uploading');
    setProgress(0);
    setStatusMessage('Inicializando canal seguro de streaming...');
    setErrorMessage('');

    try {
      // 1. Obter URL segura de upload direto
      const initRes = await fetch('/api/video-upload', {
        method: 'POST',
      });

      if (!initRes.ok) {
        const errData = await initRes.json();
        throw new Error(errData.error || 'Não foi possível iniciar o envio.');
      }

      const { uploadUrl, uploadId } = await initRes.json();

      if (!uploadUrl || !uploadId) {
        throw new Error('Servidor não retornou parâmetros válidos para upload.');
      }

      // 2. Upload direto com monitoramento de progresso real
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
            setStatusMessage(`Enviando vídeo: ${percent}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Falha no upload do arquivo (HTTP ${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error('Erro de conexão durante o envio do vídeo.'));
        xhr.ontimeout = () => reject(new Error('Tempo limite de conexão excedido.'));

        xhr.send(file);
      });

      // 3. Processamento e conversão de streaming adaptativo
      setStatus('processing');
      setProgress(100);
      setStatusMessage('Otimizando vídeo e gerando streaming em alta definição...');

      // Polling para checar quando o vídeo estiver pronto
      let attempts = 0;
      const maxAttempts = 60; // 2 minutos máximo
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const checkRes = await fetch(`/api/video-upload?uploadId=${encodeURIComponent(uploadId)}`);
          if (checkRes.ok) {
            const data = await checkRes.json();

            if (data.status === 'ready' && data.playbackId) {
              clearInterval(pollInterval);
              setStatus('success');
              setStatusMessage('Vídeo processado com sucesso!');
              onUploadSuccess({
                streamUrl: data.streamUrl || `https://stream.mux.com/${data.playbackId}.m3u8`,
                playbackId: data.playbackId,
                durationFormatted: data.durationFormatted,
                thumbnailUrl: data.thumbnailUrl,
              });
              return;
            }

            if (data.status === 'errored') {
              clearInterval(pollInterval);
              setStatus('error');
              setErrorMessage(data.error || 'Erro ao processar o vídeo.');
              return;
            }
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            // Mesmo se o polling expirar por causa do tamanho do arquivo, o vídeo continuará processando
            setStatus('success');
            setStatusMessage('Arquivo enviado com sucesso. O processamento finaliza em segundo plano.');
            onUploadSuccess({
              streamUrl: '',
              playbackId: '',
            });
          }
        } catch (err) {
          console.error('Erro no polling do vídeo:', err);
        }
      }, 2000);

    } catch (err: unknown) {
      console.error('Falha no upload do vídeo:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado ao realizar upload.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const hasActiveVideo = Boolean(currentVideoUrl || currentPlaybackId);

  return (
    <div className="flex flex-col gap-3 w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          if (e.target) e.target.value = '';
        }}
      />

      {/* Uploading or Processing State */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="border border-[var(--color-input-border)] bg-[var(--color-input-bg)] rounded-none p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none border border-[#C1FF07]/30 bg-[#C1FF07]/10 flex items-center justify-center text-[#C1FF07]">
                {status === 'processing' ? (
                  <Loader2 size={20} className="animate-spin text-[#C1FF07]" />
                ) : (
                  <Upload size={20} className="animate-pulse text-[#C1FF07]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-base truncate max-w-[280px] sm:max-w-md font-outfit uppercase tracking-tight">
                  {fileName}
                </span>
                <span className="text-xs text-text-muted">
                  {fileSizeText} • {statusMessage}
                </span>
              </div>
            </div>
            <span className="text-sm font-extrabold font-outfit text-[#C1FF07]">
              {status === 'processing' ? 'Otimizando...' : `${progress}%`}
            </span>
          </div>

          {/* Progress Bar — Sci-Fi Sharp */}
          <div className="w-full h-2 rounded-none bg-white/5 overflow-hidden border border-white/5">
            <div
              className="h-full bg-[#C1FF07] transition-all duration-300 rounded-none"
              style={{
                width: status === 'processing' ? '100%' : `${progress}%`,
                opacity: status === 'processing' ? 0.7 : 1,
              }}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-none p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-200 font-outfit uppercase tracking-tight">Falha no envio do vídeo</span>
              <span className="text-xs text-red-300/80">{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-danger text-xs px-3 py-1.5 shrink-0"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Idle / Success State with Existing Video */}
      {(status === 'idle' || status === 'success') && hasActiveVideo && (
        <div className="border border-white/10 bg-[var(--color-input-bg)] rounded-none p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-none bg-[#C1FF07]/15 flex items-center justify-center text-[#C1FF07] shrink-0 border border-[#C1FF07]/30">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-base font-outfit uppercase tracking-tight">Vídeo da Aula Ativo</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-none bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-outfit">
                  Pronto para Streaming
                </span>
              </div>
              <span className="text-xs text-text-muted mt-0.5">
                Transmissão adaptativa Ultra HD habilitada {currentDuration ? `• Duração: ${currentDuration}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="outline-btn text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Upload size={14} /> Substituir Vídeo
            </button>
            {onRemoveVideo && (
              <button
                type="button"
                onClick={onRemoveVideo}
                className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-none border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                title="Remover vídeo"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Idle State with No Video: Drag & Drop Zone */}
      {(status === 'idle' || status === 'error') && !hasActiveVideo && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-none p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 text-center ${
            isDragOver
              ? 'border-[#C1FF07] bg-[#C1FF07]/10'
              : 'border-white/15 bg-white/[0.02] hover:border-[#C1FF07]/40 hover:bg-white/[0.04]'
          }`}
        >
          <div className="w-12 h-12 rounded-none bg-[#C1FF07]/10 border border-[#C1FF07]/30 flex items-center justify-center text-[#C1FF07] transition-transform group-hover:scale-105">
            <Video size={24} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-text-base font-outfit uppercase tracking-tight">
              Clique para selecionar ou arraste o vídeo da aula aqui
            </span>
            <span className="text-xs text-text-secondary">
              Formatos aceitos: MP4, MOV, MKV, WebM (upload direto em alta definição)
            </span>
          </div>

          <button
            type="button"
            className="outline-btn text-[11px] font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-2 mt-1 pointer-events-none"
          >
            <Upload size={14} /> Selecionar Arquivo de Vídeo
          </button>
        </div>
      )}
    </div>
  );
}

export default LessonVideoUploader;
