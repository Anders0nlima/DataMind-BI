***DataMind BI***
**Categoria:** Plataforma Web Desktop de Business Intelligence e Estatística Guiada por IA.
**A Proposta de Valor (O Pitch):** *"Converse com suas planilhas brutas, obtenha respostas matematicamente exatos e gere dashboards automaticamente blindados contra erros metodológicos."*
**Como o usuário vai enxergar a tela (A UI)**
Imagine uma tela dividida em 3 blocos harmônicos:
1. **Painel Esquerdo (A Entrada):** Uma zona de *Drag & Drop*. O usuário joga ali o arquivo `vendas_gerais_2025.csv`. O sistema processa em 1 segundo e lista abaixo: *“Foram reconhecidas 12 colunas (4 Qualitativas, 8 Quantitativas)”*.
2. **Painel Central (A Vitrine Dinâmica):** É o espaço vazio principal. Aqui não existem gráficos fixos. Este painel é uma **Generative UI** — ele vai mudando de forma, desenhando tabelas limpas do IBGE ou gráficos de barras dinâmicos conforme a conversa avança.
3. **Painel Direito (O Analista IA):** Um chat limpo estilo ChatGPT, mas conectado estritamente àquela planilha do painel esquerdo.
**O Motor por trás: Os 4 Superpoderes rodando juntos**
Quando o usuário interage, o sistema aciona 4 engrenagens simultâneas:
**1. A Ingestão Blindada *(O Padrão DuckDB)***
O usuário subiu uma planilha de 50 mil linhas. O sistema **não** joga 50 mil linhas no Gemini (isso custaria dinheiro e travaria). O backend pega esse arquivo e transforma num banco **DuckDB** ultra-rápido na memória RAM do servidor. Para a IA, o backend manda apenas o *esqueleto*: `{"coluna": "faturamento", "tipo": "decimal", "exemplo": 450.50}`. Os dados reais da empresa nunca saem do servidor.
**2. O Analista Conversacional**
O usuário digita no chat: *"Qual foi o mês de maior faturamento e quanto foi?"*
• O Gemini lê a pergunta, olha o esqueleto do DuckDB e responde para o backend: `SELECT mes, SUM(faturamento) FROM tb GROUP BY mes ORDER BY sum DESC LIMIT 1`.
• O seu backend roda esse SQL no banco local, descobre que foi *Julho (R$ 142.000)* e devolve pra IA.
• A IA escreve na tela: **"O mês líder foi Julho, com R$ 142.000,00."** *(Zero matemática feita pela IA = Zero alucinação).*
**3. O Escudo Metodológico**
O usuário digita no chat: *"Desanha um gráfico de linhas mostrando o total de vendas por Categoria de Produto"*.
• O Gemini tenta montar o gráfico, mas o seu backend injetou as regras da UFPA no prompt dele.
• A IA responde: *"Identifiquei que 'Categoria de Produto' é uma variável qualitativa nominal. **Pela norma metodológica (IBGE/Cap. 6), gráficos de linhas são restritos a séries temporais.** Desenhei para você um Gráfico de Colunas horizontais, que é o padrão correto para este dado."* `[O gráfico brota no Painel Central]`.
**4. O Ferramental Clássico *(Automação IBGE)***
No topo do chat, o usuário tem 3 botões de "Ação Rápida" que não usam IA, usam engenharia pura:
• **[Gerar Rol e Distribuição de Frequência]:** O backend pega a coluna selecionada, calcula a regra de *Sturges* sozinha e cospe aquela tabela linda da apostila no painel central.
• **[Calcular Amostra de Pesquisa]:** Abre um modal pedindo a População total e o Erro tolerável (ex: 4%), aplicando a fórmula $n_0$.
• **[Baixar Relatório Oficial]:** Gera um PDF contendo a conversa e as tabelas geradas **estritamente sem traços verticais**, prontas para publicação ou entrega universitária.

**2. Requisitos Funcionais (RF)**
Os requisitos foram organizados acompanhando o ciclo de vida de uma pesquisa estatística.  
**Módulo I: Planejamento e Amostragem (Capítulos 1 e 2)**
• **RF01 - Tipificação de Variáveis:** O sistema deve obrigar o usuário a classificar cada variável cadastrada em: *Qualitativa Nominal*, *Qualitativa Ordinal*, *Quantitativa Discreta* ou *Quantitativa Contínua*.  
• **RF02 - Calculadora de Tamanho Amostral:** O sistema deve calcular o tamanho mínimo de uma amostra ($n$) recebendo o tamanho da população ($N$) e o Erro Amostral tolerável ($E_0$), aplicando estritamente as fórmulas $n_0=\frac{1}{(E_0)^2}$ e $n=\frac{N\times n_0}{N+n_0}$.  
• **RF03 - Motor de Amostragem Aleatória Simples (AAS):** O sistema deve ser capaz de receber uma lista numerada de 1 a $N$ e sortear $n$ elementos aleatórios sem reposição.  
• **RF04 - Motor de Amostragem Sistemática (AS):** O sistema deve receber uma lista ordenada, calcular o intervalo $k=\frac{N}{n}$, solicitar (ou sortear) o ponto de partida $r$ e gerar automaticamente a sequência de coleta ($r, r+k, r+2k...$).  
• **RF05 - Amostragem Estratificada (AAE):** O sistema deve permitir fatiar a população em grupos homogêneos (estratos) e calcular a sub-amostra de cada grupo nas modalidades *Uniforme* ($n_h=\frac{n}{m}$) ou *Proporcional* ($n_h=n\times\frac{N_h}{N}$).  
**Módulo II: Coleta e Crítica de Dados (Capítulos 3 e 4)**
• **RF06 - Gerador de Questionários:** O aplicativo deve permitir a montagem de formulários digitais suportando questões *abertas*, *fechadas*, de *filtro* e de *intensidade*.  
• **RF07 - Crítica Interna de Dados:** Ao importar uma planilha de dados brutos, o sistema deve varrer a base apontando inconsistências, somas erradas ou entradas omissas para validação do usuário.  
• **RF08 - Algoritmo Oficial de Arredondamento (IBGE):** O sistema deve aplicar a norma de 1993: se o algarismo a ser descartado for $\le 4$, mantém-se; se for $\ge 5$, soma-se 1 ao anterior. O sistema **está estritamente proibido** de realizar arredondamentos sucessivos (ex: 17,3452 deve ir direto para 17,3).  
**Módulo III: Distribuição de Frequências (Capítulo 7)**
• **RF09 - Geração de Rol:** O sistema deve receber dados brutos e organizá-los automaticamente em Rol (ordem crescente ou decrescente).  
• **RF10 - Distribuição Sem Classes (Discretas):** O sistema deve montar tabelas de frequência calculando automaticamente: Frequência Absoluta ($f_i$), Relativa ($f_r$), Relativa Percentual ($f_r\%$), Acumulada Abaixo ($F_i$) e Acumulada Acima ($F_j$).  
• **RF11 - Distribuição Com Classes (Contínuas):** O sistema deve automatizar o agrupamento de dados contínuos executando os seguintes passos em segundo plano:  
    1. Calcular a Amplitude Total ($A_T=x_{max}-x_{min}$).  
    2. Sugerir o número de classes ($K$) permitindo ao usuário alternar entre a regra da raiz ($\sqrt{n}$) ou a **Fórmula de Sturges** ($K\cong1+3,3\cdot\log n$).  
    3. Calcular a amplitude do intervalo ($h=\frac{A_T}{K}$).  
    4. Calcular o Ponto Médio de cada classe ($x_i=\frac{l_i+l_s}{2}$).  
    5. Adotar por padrão a notação de limite real $\vdash$ (fechado à esquerda, aberto à direita).  
**Módulo IV: Apresentação Tabular e Gráfica (Capítulos 5 e 6)**
• **RF12 - Renderizador Tabular IBGE:** As tabelas geradas na tela ou exportadas em PDF/Excel **não podem conter traços verticais externos nem linhas separadoras internas**, devendo exibir cabeçalho delimitado por traços horizontais e rodapé obrigatório com o campo "Fonte".  
• **RF13 - Seletor Inteligente de Gráficos (Smart Charting):** O aplicativo deve sugerir e liberar gráficos baseando-se estritamente nas regras da apostila:  
    ◦ *Séries temporais longas ($>5$ períodos):* Renderizar **Gráfico de Linhas/Curvas**.  
    ◦ *Séries temporais curtas ($\le 5$ períodos):* Renderizar **Gráfico de Colunas**.  
    ◦ *Nomes extensos de categorias ou Séries Geográficas:* Forçar **Gráfico de Barras Horizontais**.  
    ◦ *Variáveis nominais de até 7 parcelas:* Liberar **Gráfico de Setores (Pizza)**.  
**3. Requisitos Não-Funcionais (RNF)**
• **RNF01 - Estética e Proporção Áurea Gráfica:** A moldura dos gráficos renderizados na tela deve respeitar a proporção de largura para altura entre **1:0,57 e 1:0,80** (recomendação de 5:4 ou 7:4 da apostila) para garantir harmonia visual.  
• **RNF02 - Integridade de Precisão Flutuante:** O motor de cálculo de frequências relativas deve operar com alta precisão decimal internamente, garantindo que o somatório final das proporções ($\Sigma f_r$) seja cravado em **1,00** e o percentual em **100%**.  
• **RNF03 - Modo Didático (Tooltips):** Toda fórmula aplicada pelo sistema deve possuir um ícone de interrogação `(?)` que, ao ser clicado, exibe a definição teórica daquele conceito citando a regra estatística correspondente.

4. Matriz de Rastreabilidade (Regras de Negócio)

1- Alerta de Erro Amostral(**Funcionalidade**), Cap. 2 -Fórmula de Amostra-(**Conceito da Apostila**) e Desmistifica a ideia leiga de que amostras precisam ser "10% da população"(**Gargalo que resolve para o usuário)**

2-  Bloqueio de Gráfico de Linha(**Funcionalidade**), Cap. 6.6 -Gráficos em Curvas-(**Conceito da Apostila**) e Impede o usuário de ligar pontos entre "Masculino" e "Feminino"(**Gargalo que resolve para o usuário)**

3- Auto-Sturges(**Funcionalidade**), Cap. 7.3 -Cálculo de $K$-(**Conceito da Apostila**) e Evita que o usuário crie tabelas contínuas com 25 linhas ou com apenas 2(**Gargalo que resolve para o usuário)**

4- Validador de Tabela(**Funcionalidade**), Cap. 5.1 -Normas Tabulares-(**Conceito da Apostila**) e Garante que o relatório do usuário não tome zero do professor por formatação errada(**Gargalo que resolve para o usuário)**

**Nota de Arquitetura:** O sumário da apostila indica que os Capítulos 8 a 12 cobrirão *Medidas de Tendência Central (Média, Moda, Mediana), Dispersão (Desvio Padrão), Assimétria, Curtose e Regressão Linear*. O banco de dados das suas tabelas de Frequência já deve ser desenhado prevendo armazenar os vetores $x_i \cdot f_i$ e $(x_i - \bar{x})^2 \cdot f_i$.  

5. O Analista Conversacional via IA *(O Coração do Produto)*

- **RF14 — Ingestão Tabular via Sandbox (DuckDB):** Ao fazer upload de um arquivo `.csv` ou `.xlsx`, o backend converte os dados instantaneamente em uma base de dados relacional temporária em memória (utilizando a biblioteca **DuckDB**). O sistema **jamais envia as linhas da planilha para a LLM**; ele envia apenas o *Schema* (os nomes das colunas, os tipos de dados e as 3 primeiras linhas de exemplo).
- **RF15 — Motor Text-to-Query (O Padrão Code Interpreter):** Quando o usuário perguntar *"Qual produto vendeu mais no mês de julho?"*, o Gemini recebe o *Schema* e retorna **estritamente um objeto JSON** contendo a instrução de busca oficial:
- **RF16 — Execução Determinística:** O backend executa a `sql_query` gerada pela IA diretamente no DuckDB local, extrai o valor exato (`{"produto": "Parafuso X", "total": 450}`) e devolve para a IA. **A IA nunca faz a conta matemática, ela apenas programa a calculadora.** Isso zera a chance de alucinação nos números.
- **RF17 — Resposta Multimodal e Generative UI:** Ao receber o número exato do banco, o Gemini devolve a resposta interpretada em português + o comando visual:
    
    > *"O produto líder de saídas em julho foi o **Parafuso X**, com 450 unidades vendidas."* `[Gera dinamicamente um mini-card de destaque na tela]`.
    > 
- **RF18 — Intervenção Metodológica Preventiva (O Toque do Livro):** Se o usuário pedir *"Tira a média da coluna Código_do_Produto"*, a IA deve cruzar o pedido com as regras estatísticas cadastradas e recusar educadamente:
    
    > *"Identifiquei que 'Código do Produto' é uma variável qualitativa nominal expressa por números. Matematicamente, não se calcula média de rótulos. Você gostaria de saber a **Moda** (o código que mais apareceu na planilha)?"*
    > 

**Master Commit Plan: DataMind BI
PHASE 1: PRE-PRODUCTION & ENGINE BASE**
• **Commit 1**`docs: initialize agile engineering artifacts (PRD, user stories, and ADRs)`
    ◦ **Files:** `README.md`, `docs/PRD.md`, `docs/USER_STORIES.md`, `docs/adr/001-duckdb-sandbox.md`, `docs/adr/002-ibge-heuristics.md`
    ◦ **What you prove:** You don't type code blindly; you document software trade-offs and guardrails before spending compute resources.
• **Commit 2**`chore: scaffold FastAPI backend with centralized settings and health check`
    ◦ **Files:** `backend/pyproject.toml`, `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/api/routes/health.py`, `backend/tests/test_health.py`
    ◦ **What you prove:** Solid Python backend bootstrapping, CORS configuration, and immediate automated testing (`pytest`).
• **Commit 3**`feat: define strict Pydantic gatekeeper schemas for BI outputs`
    ◦ **Files:** `backend/app/models/domain_schemas.py` (`DuckDBSchema`, `GeminiSQLPlan`, `BIQueryResponse`, `IBGETableSpec`, `GenerativeChartSpec`)
    ◦ **What you prove:** **Domain-Driven Design.** You define the exact JSON shapes your AI and UI are forced to speak before calling external APIs.
• **Commit 4**`feat: implement DuckDB in-memory tabular ingestion and schema extraction`
    ◦ **Files:** `backend/app/services/dataset_ingestion.py`, `backend/tests/test_dataset_ingestion.py`
    ◦ **What you prove:** High-performance data manipulation. Taking raw `.csv` or `.xlsx` bytes, spinning up a localized RAM DuckDB instance, and extracting pure column metadata + 3 sample rows.
**PHASE 2: THE ACADEMIC STATISTICAL ENGINE (UFPA / IBGE)**
• **Commit 5**`feat: implement official IBGE rounding and variable typification heuristics`
    ◦ **Files:** `backend/app/services/statistics/heuristics.py`, `backend/tests/test_heuristics.py`
    ◦ **What you prove:** Translating strict academic literature into code. Implementing the 1993 IBGE rounding rule (blocking successive rounding) and auto-classifying columns into *Nominal, Ordinal, Discrete, or Continuous*.
• **Commit 6**`feat: implement Sturges rule frequency distribution engine`
    ◦ **Files:** `backend/app/services/statistics/frequency.py`, `backend/tests/test_frequency.py`
    ◦ **What you prove:** Pure algorithmic math. Given a raw dataset column, calculating Amplitude ($A_T$), Sturges classes ($K$), class limits ($\vdash$), midpoints, and absolute/relative/cumulative frequencies.
• **Commit 7**`feat: implement academic sample size calculators`
    ◦ **Files:** `backend/app/services/statistics/sampling.py`, `backend/tests/test_sampling.py`
    ◦ **What you prove:** Implementing the $n_0 = \frac{1}{E_0^2}$ and $n = \frac{N \cdot n_0}{N + n_0}$ formulas, alongside Simple Random Sampling (AAS) and Systematic Sampling (AS) generators.
• **Commit 8**`feat: implement ReportLab PDF generator for IBGE-compliant tabular reports`
    ◦ **Files:** `backend/app/services/report_generator.py`, `backend/tests/test_report_generator.py`
    ◦ **What you prove:** Programmatic document styling. Forcing generated PDF tables to strictly omit vertical borders while enforcing standardized headers, footers, and mandatory source citations.
**PHASE 3: THE AI ORCHESTRATION LAYER**
• **Commit 9**`feat: implement LLM provider interface with Gemini 2.5 Flash and mock client`
    ◦ **Files:** `backend/app/services/ai/provider.py`, `backend/tests/test_ai_provider.py`
    ◦ **What you prove:** Dependency Inversion. Decoupling the codebase from Google's SDK so you can run offline mock tests that return deterministic Pydantic JSONs without spending cloud tokens.
• **Commit 10**`feat: build BI prompt factory with schema injection and smart charting guardrails`
    ◦ **Files:** `backend/app/services/ai/prompt_factory.py`
    ◦ **What you prove:** Advanced Prompt Engineering. Injecting the DuckDB schema and teaching Gemini the UFPA rulebook (e.g., *"If column is Qualitative Nominal, strictly forbid Line Charts; force Bar Charts"*).
• **Commit 11**`feat: implement deterministic Text-to-SQL execution pipeline`
    ◦ **Files:** `backend/app/services/ai/code_interpreter.py`, `backend/tests/test_code_interpreter.py`
    ◦ **What you prove:** **The Senior "Code Interpreter" pattern.** User asks question $\rightarrow$ Gemini writes DuckDB SQL $\rightarrow$ Backend executes SQL locally $\rightarrow$ Backend feeds exact math back to Gemini $\rightarrow$ Gemini speaks human Portuguese. *(Zero AI math hallucinations).*
• **Commit 12**`feat: implement methodological guardrail interception middleware`
    ◦ **Files:** `backend/app/services/ai/guardrails.py`
    ◦ **What you prove:** Defensive AI architecture. Intercepting user prompts like *"calculate mean of IDs"* before the LLM generates bad data, returning a polite pedagogical refusal based on `heuristics.py`.
**PHASE 4: ASYNC GATEWAYS & FRONTEND SCAFFOLDING**
• **Commit 13**`feat: expose async REST endpoints for datasets, BI queries, and SSE streaming`
    ◦ **Files:** `backend/app/api/routes/analytics.py` (`POST /datasets/upload`, `POST /chat/query` (SSE), `POST /statistics/quick-action`)
    ◦ **What you prove:** Modern API design. Handling multipart files, executing heavy analytics workloads, and opening Server-Sent Events (SSE) channels to stream AI thought processes.
• **Commit 14**`feat: bootstrap Vite React frontend with Tailwind and 3-panel workspace shell`
    ◦ **Files:** `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/components/layout/WorkspaceShell.tsx`
    ◦ **What you prove:** Clean, modern frontend architecture. Building a responsive B2B desktop layout (Sidebar Input, Center Canvas, Right Chat).
• **Commit 15**`feat: implement dataset dropzone and live DuckDB schema inspector sidebar`
    ◦ **Files:** `frontend/src/components/sidebar/DatasetDropzone.tsx`, `frontend/src/components/sidebar/SchemaInspector.tsx`
    ◦ **What you prove:** Client-side file validation, reactive upload loading states, and displaying parsed DuckDB column types clearly to the end-user.
• **Commit 16**`feat: build conversational chat panel connected to backend SSE stream`
    ◦ **Files:** `frontend/src/components/chat/ConversationalBI.tsx`, `frontend/src/services/sseClient.ts`
    ◦ **What you prove:** Handling asynchronous streaming in React. Rendering real-time *"Gemini is compiling SQL..."* status badges before printing the final Portuguese insight.
**PHASE 5: THE GENERATIVE UI & PRODUCTION HARDENING**
• **Commit 17**`feat: build Generative UI canvas for dynamic Recharts rendering`
    ◦ **Files:** `frontend/src/components/canvas/GenerativeCanvas.tsx`, `frontend/src/components/canvas/charts/DynamicChart.tsx`
    ◦ **What you prove:** **Generative UI.** Your React app reads a Pydantic `ChartSpec` JSON emitted by Gemini and dynamically spawns Bar, Column, or Pie charts on the fly.
• **Commit 18**`feat: implement IBGE tabular renderer inside the Generative UI canvas`
    ◦ **Files:** `frontend/src/components/canvas/tables/IBGETable.tsx`
    ◦ **What you prove:** B2B Frontend Polish. Rendering frequency distribution tables inside React that strictly obey the IBGE visual standard (no vertical borders, isolated headers).
• **Commit 19**`feat: integrate Langfuse LLM telemetry and read-only SQL sanitization`
    ◦ **Files:** `backend/app/core/telemetry.py`, `backend/app/core/sql_sanitizer.py`
    ◦ **What you prove:** Production safety. Logging token costs/latencies to Langfuse, and putting a regex regex-shield over DuckDB to strictly block `DROP`, `DELETE`, or `ALTER` injections.
• **Commit 20**`chore: add multi-stage Dockerfile and cloud deployment runbook`
    ◦ **Files:** `backend/Dockerfile`, `backend/.dockerignore`, `README.md` (updated with live architecture diagram and local setup guide)
    ◦ **What you prove:** Full-cycle ownership. Your repo clones cleanly, builds lightweight production containers, and ships flawlessly to Render and Vercel.

### 1. O Backend & Motor Analítico *(Python 3.11+)*

Essas são as bibliotecas que vão no seu `requirements.txt`:

- **`fastapi` + `uvicorn`**: O servidor web assíncrono. Permite processar planilhas pesadas em background sem travar a tela do usuário.
- **`pydantic` (v2)**: O "Constitucionalista". É ele que vai validar se o JSON que o Gemini cuspiu tem exatamente as colunas e tipos que a nossa interface espera.
- **`duckdb`** *(A grande estrela do currículo)*: Um banco de dados relacional analítico feito para rodar **dentro da memória RAM**. Em vez de carregar a planilha no lerdo `Pandas`, o DuckDB engole um arquivo `.csv` de 100MB em 0,2 segundos e permite rodar SQL puro nele.
- **`openpyxl`**: Um tradutor universal para o DuckDB conseguir ler arquivos `.xlsx` originais do Microsoft Excel sem quebrar a formatação.
- **`python-multipart`**: Biblioteca obrigatória do FastAPI para conseguir receber arquivos físicos via requisição HTTP `POST`.

### 2.  O Motor Cognitivo *(Inteligência Artificial)*

- **`google-genai`**: **MUITO CUIDADO AQUI.** Esta é a SDK *nova e oficial* lançada pelo Google recentemente. Na internet inteira você vai achar tutoriais mandando instalar `google-generativeai` (que é a versão antiga e defasada). Usar a SDK nova mostra que você está atualizado com 2026.
- **O Modelo:** `gemini-2.5-flash`. Por que o *Flash* e não o *Pro*? Porque no padrão *Code Interpreter*, a IA não precisa escrever poesias filosóficas, ela só precisa escrever uma linha de SQL determinístico rápido. O Flash faz isso em 400 milissegundos.

### 3.  O Frontend & Generative UI *(React + TypeScript)*

Esses vão no seu `package.json`:

- **`vite` + `react` + `typescript`**: A tríade moderna do desenvolvimento web. O TypeScript aqui é vital para espelhar os tipos Pydantic do backend.
- **`tailwindcss`**: Para desenhar uma interface B2B limpa, densa em informação e com cara de software financeiro de elite.
- **`react-dropzone`**: O componente padrão da indústria para criar aquela área tracejada bonita de *“Arraste seu arquivo aqui”*.
- **`recharts`**: A biblioteca de gráficos mais amigável do ecossistema React. Como ela é 100% declarativa baseada em componentes (`<BarChart>`, `<XAxis>`), o nosso código React vai ler o JSON gerado pelo Gemini e montar as tags do Recharts dinamicamente na tela.
- **`lucide-react`**: Biblioteca de ícones vetoriais leves e elegantes.

### 4. A Camada Acadêmica e Metodológica *(A Rigorosidade IBGE)*

- **`reportlab`**: A biblioteca definitiva da linguagem Python para **geração de PDFs programáticos**. Diferente de bibliotecas preguiçosas que tiram "print da tela em HTML e convertem pra PDF", o ReportLab desenha o documento vetor por vetor. Isso nos dá o controle milimétrico para dizer: *“Desenhe a linha horizontal do cabeçalho da tabela, mas omita as linhas verticais externas”* (exigência estrita do IBGE).
- *(Módulo nativo `math`)*: Não vamos instalar nada para calcular Amostragem ou Regra de Sturges. Vamos escrever os algoritmos puros usando matemática padrão do Python.

### 5.  Blindagem, CI/CD e Observabilidade

- **`pytest` + `httpx`**: Para testar automaticamente cada endpoint do FastAPI antes de mandar pra nuvem.
- **`langfuse`** *(Plano gratuito)*: O "caixa-preta" da nossa IA. Ele intercepta as chamadas do Gemini e gera um painel mostrando: quantos tokens foram gastos por pergunta, qual foi a latência e quantas vezes o modelo tentou alucinar.
- **`docker`**: Para empacotar o backend Python num container isolado.
- **Hospedagem:** **Vercel** (Frontend React) + **Render** (Backend FastAPI via Docker).