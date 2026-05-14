# Guia de Implantação: Portal de Matrículas (Vercel + Firebase)

Este guia explica como colocar o sistema no ar utilizando apenas o Firebase como banco de dados.

## 1. Configuração do Firebase
Acesse o [Console do Firebase](https://console.firebase.google.com/) e siga estas etapas:

### Authentication
*   Ative o método de login **Google**.
*   Em "Authorized domains", adicione o domínio da sua futura URL na Vercel (ex: `matriculas-2026.vercel.app`).

### Cloud Firestore
*   Crie o banco de dados em **"Production Mode"**.
*   Escolha a localização `southamerica-east1` (São Paulo) para menor latência.
*   **Regras de Segurança (Security Rules)**: Copie e cole estas regras na aba "Rules" para proteger os dados:

```firestore
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite que qualquer usuário logado com @escola leia turmas e documentos
    match /turmas/{doc} {
      allow read: if request.auth.token.email.endsWith('@escola.pr.gov.br');
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role in ['ADMIN', 'TECNICO'];
    }
    
    // Apenas o próprio cursista ou admins podem ver sua matrícula
    match /matriculas/{doc} {
      allow read: if request.auth.token.email == resource.data.cursistaEmail || 
                  get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role in ['ADMIN', 'TECNICO'];
      allow create: if request.auth.token.email.endsWith('@escola.pr.gov.br');
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role in ['ADMIN', 'TECNICO'];
    }

    // Regra geral para perfis
    match /users/{email} {
      allow read: if request.auth.token.email == email || 
                  get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'ADMIN';
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'ADMIN';
    }
  }
}
```

## 2. Deploy na Vercel

1.  **GitHub**: Suba todos os arquivos da sua pasta `Nova_Matricula` para um novo repositório privado no GitHub.
2.  **Vercel**: 
    *   Crie um novo projeto e selecione o repositório.
    *   No campo **Environment Variables**, adicione as chaves abaixo (copie os valores do seu `.env.local`):
        *   `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
        *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
        *   `NEXT_PUBLIC_FIREBASE_APP_ID`
        *   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
        *   `NEXT_PUBLIC_GEMINI_API_KEY` (Sua chave do Google AI Studio)
        *   `NEXT_PUBLIC_APPS_SCRIPT_URL` (URL do seu Web App publicado)
3.  **Deploy**: Clique em "Deploy". Em 2 minutos o site estará online.

## 3. Primeiro Acesso (Dica de Ouro)
Como o sistema nasce vazio, você precisará se tornar ADMIN manualmente no primeiro acesso:
1.  Logue no site uma vez com seu e-mail `@escola`.
2.  Vá no **Firebase Console > Firestore > Collection 'users'**.
3.  Localize seu e-mail e altere o campo `role` de `CURSISTA` para `ADMIN`.
4.  Recarregue o portal e você terá acesso ao menu de Importação CSV para subir as turmas.
