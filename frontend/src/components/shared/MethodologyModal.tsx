import React from 'react';
import { X, ShieldCheck, Calculator, BookOpen } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';

export function MethodologyModal() {
  const { isMethodologyOpen, setMethodologyOpen } = useConfigStore();

  if (!isMethodologyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Metodologia e Privacidade</h2>
              <p className="text-sm text-slate-400">Como o DataMind BI processa seus dados</p>
            </div>
          </div>
          <button 
            onClick={() => setMethodologyOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1 text-slate-300">
          
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-200">Privacidade Absoluta (Processamento Local)</h3>
            </div>
            <p className="text-sm leading-relaxed mb-3">
              No DataMind BI, levamos a segurança dos seus dados a sério. Quando você faz o upload de uma planilha (CSV ou Excel), 
              <strong> o conteúdo do seu arquivo nunca é enviado para a Inteligência Artificial</strong>. 
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-2">
              <p><strong>Como funciona a IA?</strong> Nós enviamos para a Inteligência Artificial apenas a <em>estrutura</em> da sua tabela (os nomes das colunas e os tipos de dados). A IA escreve comandos SQL (perguntas) baseadas nessa estrutura.</p>
              <p><strong>Como o cálculo é feito?</strong> Utilizamos o motor <strong>DuckDB</strong>, um banco de dados analítico de altíssima performance embutido no próprio sistema local. O DuckDB roda os comandos SQL diretamente na sua máquina, processa os cálculos e devolve apenas o resultado final (ex: "Média = 45").</p>
              <p className="text-emerald-400 font-medium mt-2">✓ Seus dados confidenciais não saem do ambiente controlado.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-slate-200">Rigor Estatístico e Normas UFPA/IBGE</h3>
            </div>
            <p className="text-sm leading-relaxed mb-3">
              Para garantir que as análises geradas automaticamente possuam rigor científico e sejam aceitas em meios acadêmicos e corporativos do Brasil, implementamos regras metodológicas recomendadas pelo <strong>IBGE (Instituto Brasileiro de Geografia e Estatística)</strong>.
            </p>
            <ul className="list-disc list-outside ml-5 space-y-3 text-sm">
              <li>
                <strong className="text-slate-200">Regra de Sturges:</strong> Na criação de Histogramas e Tabelas de Distribuição de Frequência, o sistema calcula matematicamente o número ideal de classes (intervalos) para variáveis quantitativas usando a fórmula de Sturges <code>k = 1 + 3.322 * log10(N)</code>, evitando distorções visuais.
              </li>
              <li>
                <strong className="text-slate-200">Arredondamento Padrão:</strong> Diferente de muitas linguagens de programação que usam "Round Half to Even" (arredondamento bancário), nossos cálculos estatísticos utilizam o padrão <strong>Round Half Up</strong>, comumente adotado na academia brasileira, onde o 5 sempre arredonda o valor para cima.
              </li>
              <li>
                <strong className="text-slate-200">Formatação Tabular ABNT/IBGE:</strong> As tabelas geradas em PDF e na tela podem seguir rigorosamente a Norma Tabular de 1993, onde tabelas estatísticas não possuem bordas verticais e mantêm uma estrutura aberta nas laterais.
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0 text-center rounded-b-2xl">
          <button 
            onClick={() => setMethodologyOpen(false)}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
