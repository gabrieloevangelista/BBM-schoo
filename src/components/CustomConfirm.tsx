'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldAlert, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // Optional for alerts
}

function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  // Check if it looks like a delete action
  const isDelete = message.toLowerCase().includes('excluir') || 
                   message.toLowerCase().includes('remover') || 
                   message.toLowerCase().includes('desfazer');

  return (
    <div className="fixed inset-0 bg-[#010103]/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="glass-panel w-full max-w-[420px] p-6 flex flex-col gap-5 border border-white/10"
        style={{ 
          backgroundColor: '#171821', 
          borderRadius: '4px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
              isDelete ? 'bg-red-500/10 text-red-500' : 'bg-[#C1FF07]/10 text-[#C1FF07]'
            }`}>
              <ShieldAlert size={18} />
            </div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-outfit m-0">
              {title}
            </h3>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="p-1 bg-transparent border-0 text-white/40 hover:text-white cursor-pointer transition duration-150"
              style={{ minWidth: 'auto' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Message body */}
        <p className="text-xs text-text-secondary leading-relaxed m-0 font-medium">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/[0.04]">
          {onCancel && (
            <button
              onClick={onCancel}
              className="outline-btn text-[10px] font-extrabold uppercase tracking-wider"
              style={{ padding: '8px 16px', minWidth: 'auto' }}
            >
              Cancelar
            </button>
          )}
          
          <button
            onClick={onConfirm}
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              isDelete 
                ? 'bg-red-500 hover:bg-red-600 border border-red-500 text-white' 
                : 'btn-primary'
            }`}
            style={{ 
              padding: '8px 16px', 
              minWidth: 'auto',
              borderRadius: '2px',
              backgroundColor: isDelete ? '#ef4444' : 'var(--color-primary-lemon)',
              borderColor: isDelete ? '#ef4444' : 'var(--color-primary-lemon)',
              color: isDelete ? '#fff' : 'var(--color-switch-active-text)'
            }}
          >
            {isDelete ? 'Confirmar Exclusão' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function customConfirm(message: string, title: string = 'Aviso de Segurança'): Promise<boolean> {
  return new Promise((resolve) => {
    // Prevent rendering during server-side build phase
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = (value: boolean) => {
      root.unmount();
      container.remove();
      resolve(value);
    };

    root.render(
      <ConfirmModal 
        title={title}
        message={message}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    );
  });
}

export function customAlert(message: string, title: string = 'Aviso'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = () => {
      root.unmount();
      container.remove();
      resolve();
    };

    root.render(
      <ConfirmModal 
        title={title}
        message={message}
        onConfirm={handleClose}
      />
    );
  });
}
