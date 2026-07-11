import React from 'react';
import AdminTabs from '@/components/AdminTabs';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      {/* Global Admin Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-sm text-text-secondary mb-6">
          Gerencie as masterclasses, faça upload de recursos/planilhas e agende mentorias.
        </p>
        
        <AdminTabs />
      </div>

      {/* Admin Page Content */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
