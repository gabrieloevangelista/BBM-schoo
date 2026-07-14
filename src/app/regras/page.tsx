'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function RegrasPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8">
      <div>
        <Link href="/comunidade" className="text-text-secondary hover:text-white flex items-center gap-2 mb-6 transition-colors w-fit">
          <ArrowLeft size={16} /> Voltar para a Comunidade
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded bg-[#C1FF07]/10 text-[#C1FF07] flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h1 className="page-title m-0">Regras da Comunidade</h1>
        </div>
        <p className="page-subtitle mt-2">Nossa comunidade é um ambiente seguro, profissional e focado no desenvolvimento de negócios. Para manter este padrão de excelência, implementamos regras rígidas e monitoradas por Inteligência Artificial.</p>
      </div>

      <section className="glass-panel p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <h2 className="text-lg font-outfit font-bold text-white mb-4 flex items-center gap-2">
          <XCircle className="text-red-500" size={20} />
          Conteúdo Estritamente Proibido
        </h2>
        <p className="text-sm text-text-secondary mb-6">A tentativa de publicar qualquer conteúdo listado abaixo resultará em bloqueio automático e imediato da publicação, podendo levar à suspensão permanente da sua conta.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Nudez e Conteúdo Sexual</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li>• Nudez total ou parcial</li>
              <li>• Conteúdo sexual explícito ou sugestivo</li>
              <li>• Pessoas seminuas</li>
              <li>• Lingerie sensual, biquíni, maiô ou sunga</li>
              <li>• Transparência intencional em roupas</li>
              <li>• Poses sexualizadas e fetiches</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Drogas e Álcool</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li>• Uso, promoção ou comércio de drogas ilícitas</li>
              <li>• Plantação ou parafernália (cachimbo, seringa)</li>
              <li>• Consumo ou promoção de bebidas alcoólicas</li>
              <li>• Cigarros, charutos, vapes, narguilé ou produtos de tabaco</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Violência e Armas</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li>• Armas de fogo, armas brancas, explosivos ou munições</li>
              <li>• Violência gráfica, sangue excessivo ou automutilação</li>
              <li>• Discurso de ódio e símbolos extremistas</li>
              <li>• Apologia ao terrorismo ou atividades criminosas</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Comportamento Nocivo</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li>• Ofensas, xingamentos ou assédio</li>
              <li>• Jogos de azar, cassinos ou apostas</li>
              <li>• Golpes financeiros, fraudes ou pirâmides</li>
              <li>• Spam e links maliciosos</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="glass-panel p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#C1FF07]"></div>
        <h2 className="text-lg font-outfit font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-[#C1FF07]" size={20} />
          Conteúdo Encorajado
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-md">
            <h3 className="text-sm font-bold text-white mb-2">Networking e Negócios</h3>
            <p className="text-xs text-text-muted leading-relaxed">Compartilhe suas vitórias, novos contratos, estratégias que deram certo e aprendizados que podem ajudar outros membros a crescerem seus negócios.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-md">
            <h3 className="text-sm font-bold text-white mb-2">Dúvidas Técnicas</h3>
            <p className="text-xs text-text-muted leading-relaxed">Não tenha medo de perguntar. Poste dúvidas sobre ferramentas, marketing, vendas e gestão. A comunidade está aqui para elevar o nível de todos.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
