# 📬 Guia de Configuração - Notificações Firebase

## O que foi implementado

Um sistema completo de notificações push com Firebase Cloud Messaging (FCM) que permite:
- Solicitar permissão de notificações do navegador
- Registrar e armazenar tokens FCM
- Enviar notificações em tempo real
- Notificações mesmo quando a aba está fechada

## Configuração Necessária no Firebase

### 1. Gerar VAPID Key

A VAPID Key é necessária para autenticar seu aplicativo junto ao Firebase.

```bash
# No seu terminal local (precisa de firebase-tools):
npm install -g firebase-tools
firebase login
firebase init messaging
```

Ou vá diretamente ao Console do Firebase:

1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto
3. Vá para **Project Settings** (ícone de engrenagem)
4. Clique em **Cloud Messaging**
5. Sob "Web Push certificates", clique em **Generate Key Pair**
6. Copie a chave pública (Public Key)

### 2. Adicionar VAPID Key às Variáveis de Ambiente

No arquivo `.env.local` (ou na Vercel):

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=sua_chave_publica_aqui
```

**Importante**: A VAPID Key deve estar prefixada com `NEXT_PUBLIC_` para estar disponível no navegador.

### 3. Configurar Firebase Cloud Messaging Rules (Firestore)

No Firebase Console, certifique-se de que as regras permitem salvar tokens:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    // ... outras regras existentes
  }
}
```

## Como Usar

### Para Usuários (Frontend)

1. Clique no botão de sino (🔔) no canto superior direito
2. Autorize as notificações no prompt do navegador
3. Se aprovado, o botão ficará verde com um indicador de ativo
4. Seu token será salvo automaticamente

### Para Desenvolvedores (Enviar Notificações)

Use a Admin SDK ou Firebase Console:

```javascript
// Node.js / Backend
const admin = require('firebase-admin');

admin.messaging().sendToTopic('notifications', {
  notification: {
    title: 'Título da Notificação',
    body: 'Corpo da mensagem',
    icon: 'https://example.com/icon.png'
  },
  data: {
    link: '/documentos',
    priority: 'alta'
  }
});
```

Ou via Firebase Console:
1. Cloud Messaging > Enviar sua primeira mensagem
2. Preencha título e corpo
3. Selecione "Usuários segmentados" ou "Tópicos"
4. Clique em "Enviar"

## Troubleshooting

### "Permissão negada"
- O usuário recusou as notificações
- Solução: Precisa permitir nas configurações do navegador

### "Service Worker não encontrado"
- Certifique-se que `/public/firebase-messaging-sw.js` existe
- Verifique o console para erros

### "Token não está sendo salvo"
- Verificar se `NEXT_PUBLIC_FIREBASE_VAPID_KEY` está configurado
- Verificar regras do Firestore
- Verifique o Network tab para erros na API

### "Notificações não aparecem em background"
- Verifique se o navegador suporta (não suporta em modo privado algumas vezes)
- Confirme que o Service Worker está registrado
- Verifique a guia "Application" > "Service Workers" no DevTools

## Estrutura de Arquivos Criados

```
/workspaces/matriculas2026/
├── services/
│   └── notificationService.ts          # Serviço de notificações
├── components/
│   └── NotificationButton.tsx           # Botão de ativar notificações
├── app/
│   └── api/
│       └── notifications/
│           └── token/
│               └── route.ts            # API para salvar tokens
└── public/
    └── firebase-messaging-sw.js         # Service Worker
```

## Próximos Passos

1. ✅ Implementar notificações push (FEITO)
2. 📋 Criar admin panel para enviar notificações
3. 📊 Adicionar histórico de notificações
4. 🔔 Integrar notificações com eventos de matrículas
5. 📲 Suporte a notificações em mobile

## Referências

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
