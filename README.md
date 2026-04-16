# Plataforma de Progressão Docente - Backend

Backend modular de uma plataforma para gestão, organização e geração automatizada do Relatório de Atividades Docentes (RAD) com foco em processos de progressão funcional em universidades federais.

## 🎯 Visão Geral

Este é o servidor NestJS que fornece APIs REST para:

- **Autenticação e Autorização** via JWT + RBAC (Role-Based Access Control)
- **Gestão de Usuários** (docentes e administradores)
- **Persistência de Dados** com Prisma ORM e PostgreSQL
- **Validação de Entrada** com class-validator e class-transformer
- **Segurança** com bcrypt, guards e interceptors
- **Logging e Rastreamento** de requisições HTTP
- **CORS Configurável** por ambiente

## 📋 Stack Técnico

- **Runtime**: Node.js 20.19+
- **Framework**: NestJS 11.x
- **Linguagem**: TypeScript 5.x
- **ORM**: Prisma 7.x
- **Banco de Dados**: PostgreSQL 16
- **Autenticação**: JWT + Passport
- **Validação**: class-validator + class-transformer + Joi
- **Container**: Docker + Docker Compose
- **Testes**: Jest + Supertest (unit e e2e)

## 🌐 Ambiente hospedado (Vercel + Supabase)

Existe um deploy de referência da API na **Vercel**, usando **PostgreSQL gerenciado pelo Supabase** como banco em nuvem. No painel da Vercel, `DATABASE_URL` deve ser a connection string do projeto Supabase (modo que o Supabase recomendar para servidores — em geral com **SSL**).

| Ambiente        | URL |
| --------------- | --- |
| **API**         | [https://progressao-backend.vercel.app/](https://progressao-backend.vercel.app/) |
| **Front-end**   | [https://progressao-frontend.vercel.app/](https://progressao-frontend.vercel.app/) |

- Rotas HTTP da API ficam sob o prefixo **`/api`** (ex.: `https://progressao-backend.vercel.app/api/...`).
- O deploy usa o entrypoint serverless em `api/index.ts` com build `@vercel/node`; a configuração está em `vercel.json`.
- No handler da Vercel, o **CORS** está configurado com `origin: true` (reflete a origem da requisição), o que permite que o front na Vercel chame a API sem ajuste manual de lista de origens nesse entrypoint.

**Variáveis na Vercel:** além de `DATABASE_URL` (Supabase), defina os mesmos segredos exigidos em produção, por exemplo `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` (em produção a senha de admin tem requisito mínimo de tamanho — ver validação em `src/config/env.validation.ts`). Após conectar o banco, aplique migrations e rode o seed se precisar do usuário admin inicial:

```bash
npm run prisma:migrate:deploy
npm run prisma:seed
```

(Execute com `DATABASE_URL` do Supabase disponível no ambiente, por exemplo na máquina local apontando para o projeto remoto ou no pipeline de deploy.)

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20.19+
- Docker e Docker Compose
- npm ou yarn

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações (padrões funcionam para desenvolvimento local):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/progressao_docente?schema=public"
JWT_SECRET="dev_secret_change_me_please"
JWT_REFRESH_SECRET="dev_refresh_secret_change_me"
JWT_EXPIRES_IN="1d"
JWT_EXPIRES_IN_SECONDS=86400
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
ADMIN_EMAIL="admin@progressao.uf.br"
ADMIN_NAME="Admin"
ADMIN_PASSWORD="Admin@123456"
```

### 3. Subir PostgreSQL com Docker

```bash
npm run docker:up
```

Verifique se o container está saudável:

```bash
npm run docker:logs
```

Para parar o container:

```bash
npm run docker:down
```

### 4. Preparar Banco de Dados

Gere o cliente Prisma:

```bash
npm run prisma:generate
```

Aplique as migrations:

```bash
npm run prisma:migrate:deploy
```

Execute o seed com usuário admin inicial:

```bash
npm run prisma:seed
```

### 5. Iniciar a Aplicação

**Desenvolvimento (com hot-reload)**:

```bash
npm run start:dev
```

**Produção**:

```bash
npm run build
npm run start:prod
```

A API estará disponível em **`http://localhost:3000/api`**.

## 👤 Usuário Default Para Testes

Para testar sem criar conta manualmente, rode o seed:

```bash
npm run prisma:seed
```

Após isso, você pode fazer login com o usuário admin padrão:

- Email: `admin@progressao.uf.br`
- Senha: `Admin@123456`
- Role: `ADMIN`

Esses valores vêm das variáveis `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` no `.env`. Se você alterar essas variáveis, o seed passa a usar os novos dados.

No **ambiente hospedado** (Vercel + Supabase), as mesmas credenciais só funcionam se o seed tiver sido executado contra esse banco e se as variáveis de admin no ambiente corresponderem.

## 📚 Estrutura de Pastas

```
src/
├── auth/                 # Módulo de autenticação (JWT, register, login)
│   ├── dto/
│   │   └── login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                # Módulo de usuários
│   ├── dto/
│   │   └── create-user.dto.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── prisma/              # Integração ORM global
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/              # Módulo compartilhado
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── enums/
│   │   └── role.enum.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts
│   ├── interceptors/
│   │   └── transform-response.interceptor.ts
│   ├── middleware/
│   │   └── logging.middleware.ts
│   └── types/
│       └── public-user.type.ts
├── config/              # Configuração centralizada
│   └── env.validation.ts
├── app.controller.ts
├── app.service.ts
└── app.module.ts        # Módulo raiz com imports
prisma/
├── schema.prisma        # Schema da base de dados
├── seed.ts              # Script de seed
└── migrations/          # Migrações geradas
prisma.config.ts         # Configuração do Prisma 7 (datasource, schema e migrations)
test/
└── app.e2e-spec.ts      # Testes e2e
```

## 🤝 Guia de contribuição (Backend)

Esta seção define o padrão para evolução do backend por todos os devs.

### Princípios de arquitetura

- Organização por domínio/módulo (`auth`, `users`, etc.).
- Regra de negócio em `service`; controller apenas orquestra request/response.
- Acesso a dados isolado (Prisma/service específico), sem espalhar queries em controllers.
- Reuso de utilitários transversais em `src/common`.
- APIs devem manter envelope consistente (`success`, `data`, `error`, `meta` quando aplicável).

### Como criar um novo módulo

Use o Nest CLI para gerar a base e depois ajuste para o padrão do projeto:

```bash
# Exemplo para um módulo "relatorios"
npx nest g module relatorios
npx nest g controller relatorios --no-spec
npx nest g service relatorios --no-spec
```

Fluxo recomendado:

1. Criar módulo, controller e service.
2. Criar DTOs em `src/<modulo>/dto` com `class-validator`.
3. Definir contratos/interfaces em `src/<modulo>/interfaces` quando necessário.
4. Implementar regra de negócio no `service`.
5. Adicionar guards/decorators de autorização quando a rota exigir autenticação/RBAC.
6. Cobrir com testes unitários (`*.spec.ts`) e e2e para fluxos críticos.
7. Se houver mudança de banco, criar migration Prisma e atualizar seed quando necessário.

### Convenções obrigatórias de código

- TypeScript estrito, sem `any` em código de aplicação.
- Validar input em borda de API (DTO + ValidationPipe).
- Em `ValidationPipe`, usar opções estritas (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).
- Erros tratados explicitamente, com mensagens seguras para cliente.
- Sem `console.log` em produção.
- Nomes semânticos, funções pequenas e responsabilidades claras.
- Evitar mutação de objetos compartilhados; preferir operações imutáveis.

### SOLID aplicado ao NestJS

- **S (Single Responsibility):** controller não contém regra de negócio; service não contém regra de transporte HTTP.
- **O (Open/Closed):** estender comportamento por novos providers/estratégias ao invés de editar fluxos estáveis.
- **L (Liskov):** implementações devem respeitar contratos (interfaces/types) publicados.
- **I (Interface Segregation):** interfaces pequenas e orientadas ao caso de uso.
- **D (Dependency Inversion):** depender de abstrações e injeção de dependência, evitando acoplamento rígido.

### Padrões de segurança (obrigatório)

- Nunca hardcode de secrets (usar variáveis de ambiente).
- Senhas sempre com hash (`bcrypt`), sem retorno em payloads.
- JWT obrigatório em rotas protegidas e RBAC quando aplicável.
- Sempre validar e sanitizar entrada externa.
- Evitar vazamento de detalhes internos em mensagens de erro.
- Respeitar throttling global e por rota para endpoints sensíveis.

### Banco de dados e Prisma

- Toda alteração de schema deve virar migration versionada em `prisma/migrations`.
- Não editar migration já aplicada em ambiente compartilhado.
- Revisar impacto de índices/constraints em queries críticas.
- Atualizar seed quando o fluxo de onboarding depender de novos campos obrigatórios.

### Checklist antes de abrir PR

1. `npm run lint` sem erros.
2. `npm run build` sem erros.
3. `npm test` passando.
4. Para mudanças críticas de fluxo HTTP, rodar também `npm run test:e2e`.
5. Para alteração de schema, validar migration com `npm run prisma:migrate:status`.
6. Sem hardcode de segredo, token ou credencial.
7. Endpoints novos/alterados documentados no README (ou documentação técnica associada).

## 🔐 Autenticação e Autorização

### Registrar Novo Usuário

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "docente@universidade.br",
  "name": "Dr. João Silva",
  "password": "Senha@123456",
  "role": "USER"  # opcional, padrão é USER
}
```

**Resposta (201 Created)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "docente@universidade.br",
      "name": "Dr. João Silva",
      "role": "USER",
      "createdAt": "2026-04-14T15:39:00.000Z",
      "updatedAt": "2026-04-14T15:39:00.000Z"
    }
  }
}
```

### Fazer Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@progressao.uf.br",
  "password": "Admin@123456"
}
```

**Resposta (200 OK)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "admin@progressao.uf.br",
      "name": "Admin",
      "role": "ADMIN",
      "createdAt": "2026-04-14T15:39:00.000Z",
      "updatedAt": "2026-04-14T15:39:00.000Z"
    }
  }
}
```

### Usar Token em Requisições Protegidas

Adicione o header `Authorization` com o token JWT:

```bash
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### RBAC - Proteger Rotas por Role

Exemplo no controller:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('admin')
export class AdminController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
}
```

**Roles disponíveis**:

- `ADMIN`: Acesso total à plataforma
- `USER`: Acesso básico (perfil próprio)

## 📊 API Endpoints

### Autenticação

| Método | Endpoint         | Descrição              | Autenticação |
| ------ | ---------------- | ---------------------- | ------------ |
| POST   | `/auth/register` | Registrar novo usuário | ❌           |
| POST   | `/auth/login`    | Fazer login            | ❌           |

### Usuários

| Método | Endpoint    | Descrição                           | Autenticação | Role     |
| ------ | ----------- | ----------------------------------- | ------------ | -------- |
| GET    | `/users/me` | Obter perfil do usuário autenticado | ✅ JWT       | Qualquer |
| GET    | `/users`    | Listar todos os usuários            | ✅ JWT       | ADMIN    |

## 🗄️ Banco de Dados

### Schema Prisma

No Prisma 7, a URL de conexão fica em `prisma.config.ts` (via `env('DATABASE_URL')`).
Por isso, o `prisma/schema.prisma` mantém apenas o provider no bloco `datasource`.

O banco tem dois modelos principais:

```prisma
enum Role {
  ADMIN
  USER
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String   @map("password_hash")
  role         Role     @default(USER)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
}
```

### Gerenciar Migrations

Antes de rodar comandos Prisma, confirme que o arquivo `prisma.config.ts` existe e que a variável `DATABASE_URL` está definida no `.env`.

**Ver status das migrations**:

```bash
npm run prisma:migrate:status
```

**Criar nova migration após alterar schema**:

```bash
npm run prisma:migrate:dev --name nome_descritivo_da_mudanca
```

**Aplicar migrations em produção**:

```bash
npm run prisma:migrate:deploy
```

**Aplicar migrations no ambiente local a partir das migrations já versionadas**:

```bash
npm run prisma:migrate:deploy
```

Use `prisma:migrate:dev` apenas quando você estiver criando uma nova migration no desenvolvimento.

**Abrir Prisma Studio (GUI)**:

```bash
npm run prisma:studio
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Build
npm run build              # Compilar TypeScript

# Desenvolvimento
npm run start              # Iniciar em modo produção
npm run start:dev          # Iniciar em modo development com hot-reload
npm run start:debug        # Iniciar com debugger ativo

# Formatação e Linting
npm run format             # Formatar código com Prettier
npm run lint               # Lint com ESLint e auto-fix

# Testes
npm run test               # Rodar testes unitários uma vez
npm run test:watch         # Rodar testes em modo watch
npm run test:cov           # Gerar coverage report
npm run test:debug         # Debugar testes
npm run test:e2e           # Rodar testes e2e

# Prisma
npm run prisma:generate    # Gerar Prisma Client
npm run prisma:migrate:dev # Criar e aplicar migrations
npm run prisma:migrate:status # Verificar status das migrations
npm run prisma:migrate:resolve # Resolver estado de migration manualmente
npm run prisma:studio      # Abrir Prisma Studio (GUI)
npm run prisma:seed        # Executar seed

# Docker
npm run docker:up          # Subir PostgreSQL
npm run docker:down        # Parar PostgreSQL
npm run docker:logs        # Ver logs do PostgreSQL
```

### Fluxo de Desenvolvimento

1. **Faça alterações no schema Prisma** (`prisma/schema.prisma`)
2. **Crie migration**:
   ```bash
   npm run prisma:migrate:dev --name descricao_da_mudanca
   ```
3. **O código é gerado automaticamente** (tipos Prisma)
4. **Importe e use no serviço/controller** com type-safety completo

## 🧪 Testes

### Testes Unitários

Localizam-se em arquivos `.spec.ts` próximos ao código. Executar com:

```bash
npm run test
```

### Testes E2E

Simulam requisições HTTP reais contra a API. Estão em `test/app.e2e-spec.ts`.

```bash
npm run test:e2e
```

### Coverage

Gere relatório de cobertura:

```bash
npm run test:cov
```

Relatório estará em `coverage/`.

### TDD - Test-Driven Development

Exemplo de ciclo TDD para novo endpoint:

1. **Escrever teste primeiro** (RED stage):

   ```typescript
   // test/users.e2e-spec.ts
   it('POST /api/users/register deveria criar usuário', () => {
     return request(app.getHttpServer())
       .post('/api/auth/register')
       .send({...})
       .expect(201)
   })
   ```

2. **Rodar teste** (deve falhar):

   ```bash
   npm run test:e2e
   ```

3. **Implementar feature mínima** (GREEN stage)

4. **Rodar teste novamente** (deve passar)

5. **Refatorar se necessário** (REFACTOR stage)

## 📦 Adicionando Novas Features

### Exemplo: Adicionar Módulo "Atividades"

**1. Criar estrutura de pastas**:

```
src/activities/
├── dto/
│   ├── create-activity.dto.ts
│   └── update-activity.dto.ts
├── activities.controller.ts
├── activities.service.ts
└── activities.module.ts
```

**2. Criar migration Prisma**:

```prisma
// prisma/schema.prisma
model Activity {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  title        String
  description  String?
  category     String   # ex: "ensino", "pesquisa", "extensao"
  points       Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("activities")
}

// Adicionar relação no User
model User {
  // ... campos existentes
  activities   Activity[]
}
```

**3. Aplicar migration**:

```bash
npm run prisma:migrate:dev --name add_activities_table
```

**4. Criar DTO**:

```typescript
// src/activities/dto/create-activity.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsInt()
  points: number;
}
```

**5. Criar Service**:

```typescript
// src/activities/activities.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createActivityDto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        userId,
        ...createActivityDto,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

**6. Criar Controller**:

```typescript
// src/activities/activities.controller.ts
import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createActivityDto: CreateActivityDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.activitiesService.create(req.user.sub, createActivityDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findByUser(@Req() req: { user: JwtPayload }) {
    return this.activitiesService.findByUser(req.user.sub);
  }
}
```

**7. Criar Módulo**:

```typescript
// src/activities/activities.module.ts
import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
```

**8. Importar no AppModule**:

```typescript
// src/app.module.ts
import { ActivitiesModule } from './activities/activities.module';

@Module({
  imports: [
    // ... outros módulos
    ActivitiesModule,
  ],
  // ...
})
export class AppModule {}
```

## 🔒 Segurança

### Boas Práticas Implementadas

✅ **Hash de Senha**: bcrypt com salt 10  
✅ **JWT com Expiração**: 1 dia por padrão (configurável)  
✅ **Validação de Entrada**: class-validator + Joi  
✅ **CORS Restritivo**: Configurável por ambiente  
✅ **Sem Exposição de Senha**: DTOs e mappers garantem isso  
✅ **Autenticação JWT**: Passport + NestJS Guards  
✅ **RBAC**: Role-based access control no RolesGuard  
✅ **Logging Sanitizado**: Não loga senha/token

### Checklist de Produção

Antes de fazer deploy:

- [ ] Mudar `JWT_SECRET` para valor forte (min 32 caracteres)
- [ ] Node.js versão 20.19+ em produção
- [ ] `DATABASE_URL` de produção (ex.: **Supabase**) configurado como secret na Vercel, com SSL conforme a documentação do provedor
- [ ] PostgreSQL com backup configurado
- [ ] Conexão DB com SSL
- [ ] Variáveis de ambiente seguras (secrets manager)
- [ ] Rate limiting em endpoints sensíveis
- [ ] Logs centralizados (ex: DataDog, NewRelic)
- [ ] CORS restrito a domínios permitidos
- [ ] Health checks implementados
- [ ] Monitoramento de performance
- [ ] Testes e2e passando

## 📄 Variáveis de Ambiente

| Variável                 | Tipo   | Padrão                   | Descrição                                  |
| ------------------------ | ------ | ------------------------ | ------------------------------------------ |
| `NODE_ENV`               | string | `development`            | Ambiente (development, test, production)   |
| `PORT`                   | number | `3000`                   | Porta do servidor                          |
| `DATABASE_URL`           | string | **Obrigatório**          | Connection string do PostgreSQL            |
| `JWT_SECRET`             | string | **Obrigatório**          | Chave secreta para assinar JWT             |
| `JWT_EXPIRES_IN_SECONDS` | number | `86400`                  | Expiração do JWT em segundos               |
| `CORS_ORIGIN`            | string | `*`                      | Origens CORS permitidas (comma-separated)  |
| `ADMIN_EMAIL`            | string | `admin@progressao.uf.br` | Email do admin inicial                     |
| `ADMIN_NAME`             | string | `Admin`                  | Nome do admin inicial                      |
| `ADMIN_PASSWORD`         | string | `Admin@123456`           | Senha do admin inicial (mude em produção!) |

## 📖 Documentação Adicional

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Passport.js + JWT](https://docs.nestjs.com/recipes/passport)
- [Docker Compose](https://docs.docker.com/compose/)

## 🐛 Troubleshooting

### "Database connection refused"

1. Verifique se PostgreSQL está rodando:

   ```bash
   npm run docker:logs
   ```

2. Verifique `DATABASE_URL` no `.env`

3. Teste conexão:
   ```bash
   npm run prisma:studio
   ```

### "JWT_SECRET not found"

- Certifique-se que `.env` existe e contém `JWT_SECRET`
- Application exige variável obrigatória

### Migrações com conflito

```bash
npm run prisma:migrate:resolve --rolled-back migration_name
```

Ou com passagem explícita de argumentos no npm:

```bash
npm run prisma:migrate:resolve -- --rolled-back migration_name
```

### Limpar base de dados (CUIDADO - produção!)

```bash
npm run prisma:studio
# Ou via SQL:
# DELETE FROM activities;
# DELETE FROM users;
```

## 📞 Suporte

Para reportar bugs ou sugerir features, abra uma issue no repositório.

---

**Versão**: 0.0.1  
**Última atualização**: Abril 2026  
**Status**: 🚀 Pronto para Desenvolvimento
