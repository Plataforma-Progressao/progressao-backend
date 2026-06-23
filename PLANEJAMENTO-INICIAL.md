# Planejamento Inicial do Projeto – Plataforma Progressão

## 1. Título do Projeto

**Plataforma Progressão: Sistema de Apoio à Progressão Funcional de Docentes em Universidades Federais**

---

## 2. Descrição do Projeto

A Plataforma Progressão é uma solução web desenvolvida para auxiliar docentes de universidades federais no gerenciamento de suas atividades acadêmicas e na preparação da documentação necessária para processos de progressão funcional.

A plataforma centraliza informações relacionadas ao Relatório de Atividades Docentes (RAD), permitindo o cadastro de atividades, organização de documentos comprobatórios, cálculo automático de pontuação conforme o barema institucional e geração automatizada de relatórios prontos para submissão.

O objetivo é reduzir a burocracia, minimizar erros de preenchimento e simplificar um processo que atualmente é realizado de forma manual e descentralizada.

---

## 3. Problema

Atualmente, o processo de progressão docente apresenta diversos desafios:

* Organização de documentos físicos e digitais em diferentes locais;
* Necessidade de anexar comprovantes para cada atividade realizada;
* Atualização manual de informações em múltiplos sistemas institucionais;
* Cálculo manual da pontuação do barema;
* Dificuldade de interpretar regras institucionais;
* Dependência de assinaturas e validações administrativas;
* Ausência de ferramentas que permitam acompanhar o progresso para a próxima progressão.

Esses fatores tornam o processo demorado, suscetível a erros e geram elevada carga operacional para os docentes.

---

## 4. Justificativa

A progressão funcional ocorre periodicamente durante a carreira docente e impacta diretamente a remuneração e evolução profissional.

Apesar da importância do processo, muitas instituições ainda dependem de procedimentos predominantemente manuais.

A proposta busca promover:

* Redução do tempo gasto na preparação dos relatórios;
* Diminuição de erros de pontuação;
* Melhor organização documental;
* Maior transparência no acompanhamento da progressão;
* Automatização de tarefas repetitivas.

Além disso, a solução possui potencial de adaptação para diferentes universidades, considerando as particularidades de seus baremas.

---

## 5. Público-Alvo

### Primário

* Docentes de Universidades Federais

### Secundário

* Coordenadores de curso
* Chefias de departamento
* Comissões de avaliação
* Setores de gestão de pessoas
* Pró-reitorias responsáveis por progressão funcional

---

## 6. Objetivo Geral

Desenvolver uma plataforma web capaz de auxiliar docentes no gerenciamento de atividades acadêmicas, cálculo de pontuação e geração automatizada de relatórios para progressão funcional.

---

## 7. Objetivos Específicos

* Permitir o cadastro e gerenciamento de atividades docentes;
* Centralizar documentos comprobatórios;
* Automatizar cálculos de pontuação;
* Implementar regras configuráveis de barema;
* Fornecer indicadores de progresso para a próxima progressão;
* Gerar relatórios em formato PDF;
* Oferecer notificações e alertas de pendências;
* Possibilitar futuras integrações com sistemas acadêmicos.

---

## 8. Funcionalidades Principais

### Gestão de Atividades

* Cadastro de atividades
* Edição e exclusão
* Classificação por categoria
* Histórico de atividades

### Gestão de Documentos

* Upload de arquivos
* Associação com atividades
* Organização por categorias
* Checklist de documentos obrigatórios

### Sistema de Pontuação

* Cálculo automático
* Simulação de cenários
* Percentual de progresso
* Controle de teto de pontuação

### Inteligência de Apoio

* Sugestão de enquadramento de atividades
* Validação de inconsistências
* Alertas de documentação pendente

### Relatórios

* Geração automática de RAD
* Exportação em PDF
* Visualização prévia

### Notificações

* Pendências documentais
* Atualizações necessárias
* Alcance de pontuação mínima

---

## 9. Tecnologias Previstas

### Frontend

* Angular
* Angular Material 3
* TypeScript

### Backend

* NestJS
* TypeScript

### Banco de Dados

* PostgreSQL

### ORM

* Prisma ORM

### Infraestrutura

* Docker
* Docker Compose

### Autenticação

* JWT
* Guards e Roles

### Armazenamento de Arquivos

* Inicialmente local
* Evolução futura para armazenamento em nuvem

---

## 10. Diferenciais da Solução

* Foco específico na progressão docente;
* Barema configurável por instituição;
* Centralização documental;
* Cálculo automático de pontuação;
* Acompanhamento contínuo da evolução funcional;
* Redução da carga burocrática do docente;
* Possibilidade de integração com sistemas acadêmicos existentes.

---

## 11. Escopo da Primeira Versão (MVP)

### Incluído

* Cadastro de usuários
* Login e autenticação
* Cadastro de atividades
* Upload de documentos
* Sistema básico de pontuação
* Dashboard de acompanhamento
* Geração de relatório PDF

### Não Incluído

* Integração com SIGAA
* Integração com Lattes
* Assinatura digital
* Inteligência artificial avançada
* Aplicativo mobile nativo

---

## 12. Resultados Esperados

* Redução do tempo necessário para preparar a documentação de progressão;
* Redução de erros relacionados à pontuação;
* Melhor organização de documentos comprobatórios;
* Maior controle e visibilidade sobre o processo de progressão;
* Aumento da produtividade dos docentes durante o ciclo de avaliação.

---

## 13. Nome do Projeto

**Plataforma Progressão**
