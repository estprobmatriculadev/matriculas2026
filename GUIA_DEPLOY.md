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
*   **Regras de Segurança (Security Rules)**: Copie e cole estas regras na aba "Rules" para proteger e estruturar todos os acessos do banco:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user has a role
    function hasRole(roleList) {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.token.email)) &&
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role in roleList;
    }

    // Regra geral para perfis de acesso
    match /users/{email} {
      allow read: if request.auth != null && (request.auth.token.email == email || hasRole(['ADMIN']));
      allow write: if hasRole(['ADMIN']);
    }

    // Permite que qualquer usuário logado leia as turmas
    match /turmas/{doc} {
      allow read: if request.auth != null;
      allow write: if hasRole(['ADMIN', 'TECNICO']);
    }
    
    // Apenas o próprio cursista ou admins/técnicos podem ver sua matrícula
    match /matriculas/{doc} {
      allow read: if request.auth != null && (request.auth.token.email == resource.data.cursistaEmail || hasRole(['ADMIN', 'TECNICO']));
      allow create: if request.auth != null;
      allow update: if hasRole(['ADMIN', 'TECNICO']);
    }

    // Datas importantes
    match /dates/{doc} {
      allow read: if request.auth != null;
      allow write: if hasRole(['ADMIN', 'TECNICO']);
    }

    // Documentos e Suporte
    match /documentos/{doc} {
      allow read: if request.auth != null;
      allow write: if hasRole(['ADMIN', 'TECNICO']);
    }

    // Remanejamentos (Fila e Solicitações)
    match /remanejamentos/{doc} {
      allow read: if request.auth != null && (
        request.auth.token.email == resource.data.cursistaEmail || 
        hasRole(['ADMIN', 'TECNICO', 'TUTOR'])
      );
      allow create: if request.auth != null;
      allow update, delete: if hasRole(['ADMIN', 'TECNICO']);
    }

    // Cursistas
    match /cursistas/{doc} {
      allow read: if request.auth != null;
      allow write: if hasRole(['ADMIN', 'TECNICO']);
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
