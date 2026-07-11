'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Users, MessageSquare, UserPlus, Box } from 'lucide-react';

export default function AdminTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Masterclasses', href: '/admin/reordenacao', icon: GraduationCap },
    { name: 'Mentorados', href: '/admin/membros', icon: Users },
    { name: 'Comentários', href: '/admin/comentarios', icon: MessageSquare },
    { name: 'Cadastrar Usuário', href: '/admin/cadastrar', icon: UserPlus },
    { name: 'Ecossistema', href: '/admin/ecossistema', icon: Box },
  ];

  return (
    <div className="flex items-center gap-6 border-b border-[var(--color-glass-border)] overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (pathname.startsWith('/admin') && tab.href === '/admin/reordenacao' && pathname === '/admin/reordenacao');
        // specifically, if it's the exact href, it's active
        const trulyActive = pathname === tab.href || (pathname === '/admin' && tab.href === '/admin/reordenacao');

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`pb-3 -mb-[2px] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors border-b-2 ${
              trulyActive 
                ? 'text-text-base border-primary-lemon' 
                : 'text-text-secondary border-transparent hover:text-text-base'
            }`}
          >
            <Icon size={14} /> {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
