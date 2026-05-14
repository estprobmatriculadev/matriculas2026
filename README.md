# Sistema Integrado EP & PEDFOR

Sistema de matrículas para cursos de formação continuada da Escola de Professores e Pedagogia do Paraná.

## 🚀 Deploy Automático

O projeto é automaticamente implantado no Firebase Hosting quando há push na branch `main`.

### URL de Produção
- **https://sgm-estpedfor.web.app/**

### Configuração do GitHub Actions

Para configurar o deploy automático:

1. **Gerar Service Account do Firebase:**
   ```bash
   # No Firebase Console > Project Settings > Service Accounts
   # Gerar nova chave privada (JSON)
   ```

2. **Adicionar segredo no GitHub:**
   - Vá para: Repository Settings > Secrets and variables > Actions
   - Adicione: `FIREBASE_SERVICE_ACCOUNT`
   - Cole o conteúdo completo do arquivo JSON da service account

3. **Push para main:**
   ```bash
   git add .
   git commit -m "Deploy automático configurado"
   git push origin main
   ```

### Deploy Manual

Para deploy manual local:

```bash
# Instalar Firebase CLI (se necessário)
npm install -g firebase-tools

# Login no Firebase
firebase login

# Deploy
npm run deploy
```

### Scripts Disponíveis

- `npm run dev` - Desenvolvimento local
- `npm run build` - Build da aplicação
- `npm run export` - Export para arquivos estáticos
- `npm run deploy` - Deploy completo para Firebase Hosting
- `npm run lint` - Verificação de código

## 🛠️ Tecnologias

- **Next.js 16** - Framework React
- **Firebase** - Autenticação e banco de dados
- **Tailwind CSS** - Estilização
- **TypeScript** - Tipagem
- **Framer Motion** - Animações

## 📁 Estrutura do Projeto

```
/
├── app/                    # Páginas Next.js App Router
│   ├── admin/             # Painel administrativo
│   ├── dashboard/         # Dashboard do usuário
│   ├── login/             # Página de login
│   └── matricula/[fluxo]/ # Processo de matrícula
├── lib/                   # Utilitários e configurações
│   └── firebase.ts        # Configuração Firebase
├── services/              # Lógica de negócio
└── .github/workflows/     # CI/CD
```

## 🔧 Configuração Local

1. **Clonar repositório:**
   ```bash
   git clone https://github.com/estprobmatriculadev/matriculas2026.git
   cd matriculas2026
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   - Copie `.env.local.example` para `.env.local`
   - Preencha as variáveis do Firebase

4. **Executar desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acessar:** `http://localhost:3000`

## 🔐 Autenticação

- Login restrito a contas `@escola.pr.gov.br`
- Autenticação via Google OAuth
- Controle de acesso baseado em domínio institucional

## 📊 Funcionalidades

- ✅ Dashboard administrativo com estatísticas em tempo real
- ✅ Sistema de matrículas com filtros automáticos
- ✅ Controle de vagas por turma
- ✅ Geração de protocolos de matrícula
- ✅ Interface responsiva e moderna

## 📞 Suporte

Em caso de dúvidas, entre em contato com a Coordenação de Formação (CFDEG).