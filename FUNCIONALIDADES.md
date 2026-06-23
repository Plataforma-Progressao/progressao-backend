# Funcionalidades do Sistema – Plataforma Progressão

Documento de referência das funcionalidades da **Plataforma Progressão**, alinhado ao [Planejamento Inicial](./PLANEJAMENTO-INICIAL.md) e ao estado atual da aplicação (front-end Angular + back-end NestJS).

**Legenda de status**

| Status | Significado |
| ------ | ----------- |
| **Implementado** | Disponível para uso na aplicação atual |
| **Parcial** | Existe em versão básica ou com escopo limitado |
| **Planejado** | Previsto no planejamento, ainda não entregue |

---

## 1. Visão geral dos módulos

A plataforma está organizada em áreas funcionais acessíveis após autenticação:

| Módulo | Rota (front-end) | Descrição resumida |
| ------ | ---------------- | ------------------ |
| Dashboard | `/dashboard` | Acompanhamento de pontuação, carreira e notificações |
| Atividades | `/atividades` | Cadastro e gestão de atividades acadêmicas |
| Checklist | `/checklist` | Acompanhamento de documentação obrigatória |
| Relatórios | `/relatorios` | Visualização e exportação do RAD |
| Configurações | `/configuracoes` | Perfil do docente e alteração de senha |

Área pública (sem autenticação): login, cadastro e recuperação de senha.

---

## 2. Autenticação e acesso

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Cadastro de usuários (docentes) | **Implementado** | Fluxo em etapas: dados pessoais, instituição, carreira e segurança (termos + LGPD) |
| Login com e-mail e senha | **Implementado** | Autenticação JWT com refresh token |
| Renovação automática de sessão | **Implementado** | Interceptor de refresh no front-end |
| Logout | **Implementado** | Invalidação do refresh token no back-end |
| Recuperação de senha | **Implementado** | Solicitação por e-mail e redefinição com token |
| Controle de acesso por papéis (RBAC) | **Implementado** | Papéis `USER` e `ADMIN` com guards no back-end |
| Proteção de rotas autenticadas | **Implementado** | Guards no front-end para áreas públicas e autenticadas |
| Rate limiting | **Implementado** | Throttling global na API |

**Dados coletados no cadastro:** nome, CPF, telefone, e-mail, universidade, centro, departamento, áreas de atuação, classe/nível da carreira, data da última progressão, aceite de termos e LGPD.

---

## 3. Perfil e configurações do docente

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Visualização do perfil autenticado | **Implementado** | Endpoint `GET /users/me` e tela de configurações |
| Edição de nome | **Implementado** | Atualização via `PATCH /users/me` |
| Alteração de senha | **Implementado** | Exige senha atual e confirmação da nova senha |
| Vínculo com Currículo Lattes (URL) | **Implementado** | Campo editável com atalho para abrir em nova aba |
| Identificador ORCID | **Implementado** | Campo editável com cópia e abertura do perfil |
| E-mail institucional | **Implementado** | Exibido em modo somente leitura na interface |

---

## 4. Gestão de atividades

Atividades são o núcleo do RAD e da pontuação. Toda atividade criada nasce com status **APPROVED** (sem fluxo de aprovação manual por gerenciador).

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Cadastro de atividades | **Implementado** | Título, descrição, categoria, carga horária, tipo, período e pontuação |
| Edição de atividades | **Implementado** | Mesmo formulário do cadastro, rota `/atividades/editar/:id` |
| Exclusão de atividades | **Implementado** | Remoção com confirmação na listagem |
| Classificação por categoria | **Implementado** | Ensino, Pesquisa, Extensão e Gestão |
| Listagem paginada | **Implementado** | Tabela com busca textual e paginação |
| Filtro por abas de categoria | **Implementado** | Pesquisa, Ensino, Extensão, Gestão e Todas |
| Filtro por status | **Parcial** | Mantido para compatibilidade com dados legados; novas atividades já nascem aprovadas |
| Histórico de alterações por campo | **Implementado** | Log de auditoria (`ActivityChangeLog`) exibido na edição |
| Histórico de status | **Implementado** | Modelo e API de `ActivityStatusHistory` (uso legado) |
| Associação a ciclo de progressão | **Implementado** | Atividades vinculadas ao ciclo ativo do docente |

**Campos da atividade:** título, descrição, categoria, carga horária (formato duração), tipo, período/termo, pontuação calculada ou informada.

---

## 5. Gestão de documentos e comprovantes

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Upload de arquivos por atividade | **Implementado** | Envio de comprovantes no cadastro/edição da atividade |
| Download de comprovantes | **Implementado** | Endpoint de arquivo por evidência |
| Exclusão de comprovantes | **Implementado** | Remoção individual de evidências |
| Evidências por link externo | **Parcial** | Modelo suporta `FILE` e `LINK`; interface prioriza upload de arquivo |
| Armazenamento local (desenvolvimento) | **Implementado** | Disco local via Multer |
| Armazenamento em nuvem (produção) | **Planejado** | Evolução para object storage (R2, Supabase Storage, etc.) |

---

## 6. Sistema de pontuação

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Cálculo automático de pontuação por atividade | **Implementado** | Estimativa em tempo real no formulário (`POST /activities/estimate`) |
| Agregação por pilar (categoria) | **Implementado** | Ensino, Pesquisa, Extensão e Gestão no dashboard |
| Pontuação total vs. meta | **Implementado** | Meta padrão de 2.000 pontos no ciclo |
| Percentual de progresso | **Implementado** | Barra e indicadores no dashboard e no formulário de atividade |
| Resumo persistido de pontuação | **Implementado** | Modelo `UserScoreSummary` e API dedicada |
| Simulação de cenários | **Parcial** | Estimativa por atividade; sem simulador dedicado de múltiplos cenários |
| Controle de teto de pontuação por pilar | **Planejado** | Regras configuráveis de barema ainda não parametrizáveis por instituição |
| Barema configurável por instituição | **Planejado** | Previsto no planejamento; cálculo atual usa regras fixas no back-end |

**Indicadores de carreira no dashboard:** nível atual, próximo nível, tempo no nível, publicações Qualis, orientações e comparativo do biênio.

---

## 7. Dashboard de acompanhamento

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Visão geral personalizada | **Implementado** | Saudação, resumo e papel/nível do docente |
| Card de pontuação total | **Implementado** | Pontuação atual e meta |
| Card de evolução de carreira | **Implementado** | Progresso para próximo nível, anos no nível, Qualis e orientações |
| Card de pilares | **Implementado** | Pontuação e percentual por categoria |
| Card do biênio/ciclo | **Implementado** | Ciclo ativo, percentual de conclusão e comparativo departamental |
| Notificações recentes | **Implementado** | Lista derivada de pendências e alertas do usuário |
| Indicadores de progresso para próxima progressão | **Parcial** | Métricas exibidas; regras institucionais completas ainda simplificadas |

---

## 8. Checklist de documentação

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Checklist de documentos obrigatórios | **Implementado** | Itens baseados em templates institucionais |
| Progresso total do checklist | **Implementado** | Percentual, contadores e barra segmentada |
| Status por item (Pendente, Atenção, Concluído) | **Implementado** | Atualização via API |
| Filtro por status na listagem | **Implementado** | Todos, Concluído, Atenção e Pendente |
| Associação ao ciclo de progressão | **Implementado** | Itens vinculados ao ciclo ativo |
| Gestão de templates (admin) | **Parcial** | API CRUD de `ChecklistTemplateItem`; sem interface administrativa dedicada |

---

## 9. Relatórios (RAD)

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Geração automática do RAD | **Implementado** | Montagem a partir de perfil e atividades aprovadas |
| Visualização prévia na aplicação | **Implementado** | Componente `RadDocument` na rota `/relatorios` |
| Exportação em PDF | **Implementado** | Via rota de impressão do navegador (`/relatorios/impressao`) |
| Snapshots de relatório | **Parcial** | Modelo e API `ReportSnapshot`; geração sob demanda na interface |
| Validações antes da exportação | **Parcial** | Avisos na tela quando há inconsistências nos dados |

---

## 10. Notificações e alertas

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Notificações no dashboard | **Implementado** | Alertas de pendências documentais e checklist |
| Modelo de notificações persistentes | **Implementado** | Entidade `Notification` com tons (info, sucesso, aviso, erro) |
| API de notificações | **Implementado** | CRUD e marcação de leitura |
| Central de notificações dedicada | **Planejado** | Exibição atual concentrada no dashboard |
| Alertas de pontuação mínima | **Parcial** | Indicadores visuais no dashboard; sem push/e-mail |

---

## 11. Ciclos de progressão

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Cadastro de ciclos por docente | **Implementado** | Modelo `ProgressionCycle` com período e status |
| Ciclo ativo | **Implementado** | Usado em atividades, checklist, relatórios e pontuação |
| API de ciclos | **Implementado** | CRUD completo no back-end |
| Interface de gestão de ciclos | **Planejado** | Sem tela dedicada no front-end para o docente |

---

## 12. Administração

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| Usuário administrador (seed) | **Implementado** | Criado via variáveis de ambiente e `prisma:seed` |
| Listagem de usuários (admin) | **Implementado** | Endpoint `GET /users` restrito a `ADMIN` |
| Painel administrativo no front-end | **Planejado** | Sem interface dedicada para gestão de usuários e templates |

---

## 13. Infraestrutura e integrações

| Funcionalidade | Status | Descrição |
| -------------- | ------ | --------- |
| API REST com prefixo `/api` | **Implementado** | NestJS modular |
| PostgreSQL + Prisma ORM | **Implementado** | Migrations e seed |
| Docker Compose (banco local) | **Implementado** | Desenvolvimento local |
| Deploy de referência (Vercel + Supabase) | **Implementado** | Front-end e back-end hospedados |
| PWA (manifesto e ícones) | **Implementado** | `manifest.webmanifest` e ícones em `public/icons` |
| Integração com SIGAA | **Planejado** | Fora do escopo do MVP |
| Integração com Lattes | **Planejado** | Apenas campo de URL manual no perfil |
| Assinatura digital | **Planejado** | Fora do escopo do MVP |
| Aplicativo mobile nativo | **Planejado** | Fora do escopo do MVP |
| Inteligência artificial avançada | **Planejado** | Sugestão de enquadramento e validações inteligentes previstas |

---

## 14. Alinhamento com os objetivos específicos do planejamento

| Objetivo inicial | Situação atual |
| ---------------- | -------------- |
| Cadastro e gerenciamento de atividades docentes | **Atendido** |
| Centralizar documentos comprobatórios | **Parcialmente atendido** — upload por atividade e checklist; armazenamento em nuvem pendente |
| Automatizar cálculos de pontuação | **Parcialmente atendido** — estimativa e agregação implementadas; barema configurável pendente |
| Regras configuráveis de barema | **Pendente** |
| Indicadores de progresso para a próxima progressão | **Parcialmente atendido** — dashboard com métricas de carreira e pontuação |
| Relatórios em PDF | **Atendido** |
| Notificações e alertas de pendências | **Parcialmente atendido** — dashboard e modelo de notificações |
| Integrações com sistemas acadêmicos | **Pendente** |

---

## 15. Escopo do MVP – conferência

### Incluído no MVP (planejamento) × estado atual

| Item do MVP | Estado |
| ----------- | ------ |
| Cadastro de usuários | ✅ Implementado |
| Login e autenticação | ✅ Implementado |
| Cadastro de atividades | ✅ Implementado |
| Upload de documentos | ✅ Implementado |
| Sistema básico de pontuação | ✅ Implementado |
| Dashboard de acompanhamento | ✅ Implementado |
| Geração de relatório PDF | ✅ Implementado |

### Fora do MVP (conforme planejamento)

- Integração com SIGAA
- Integração com Lattes (além de URL manual)
- Assinatura digital
- Inteligência artificial avançada
- Aplicativo mobile nativo

---

## 16. Regras de domínio relevantes

- **Não há fluxo de aprovação manual por gerenciador.** Toda atividade criada nasce com status `APPROVED`.
- **Não implementar telas ou endpoints de revisão/aprovação/rejeição de atividades**, salvo pedido explícito.
- O **filtro de status** na listagem de atividades permanece apenas para compatibilidade com dados legados.

---

*Última atualização: junho de 2026 — documento vivo; atualizar conforme novas entregas.*
