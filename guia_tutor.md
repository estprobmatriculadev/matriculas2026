# Guia do Tutor - SGM Matrículas e Gestão CFDEG

## Visão Geral

O módulo **Tutor** permite que educadores (Tutores) acompanhem em **tempo real** as matrículas dos cursistas que estão sob sua orientação.

## Como Funciona

### 1. Tipos de Usuário

O sistema suporta os seguintes tipos de usuários:
- **CURSISTA**: Estudante que realiza matrículas
- **TUTOR**: Educador que acompanha cursistas *(novo)*
- **ADMIN**: Administrador do sistema
- **TECNICO**: Técnico responsável por importação de dados

### 2. Página do Tutor

A página dedicada do Tutor está localizada em `/tutor` e fornece:

#### Dashboard
- **Contador de Cursistas**: Total de cursistas vinculados
- **Contador de Matrículas**: Total de matrículas registradas

#### Listagem de Cursistas
Cada cursista vinculado ao tutor é exibido com:
- Nome completo
- E-mail
- Número total de matrículas
- Opção para expandir e visualizar detalhes

#### Detalhes de Matrículas
Ao expandir um cursista, você visualiza:
- **Turma**: Nome da turma em que foi matriculado
- **Estabelecimento**: Instituição de ensino
- **Data**: Data e hora da matrícula
- **Status**: CONFIRMADA, PENDENTE ou CANCELADA
- **Fluxo**: Tipo de programa (EP ou PEDFOR)

### 3. Monitoramento em Tempo Real

O sistema usa **listeners do Firebase** para atualizar automaticamente as matrículas sem necessidade de recarregar a página:

```typescript
// As matrículas são atualizadas em tempo real através de onSnapshot
// Quando um cursista vinculado se matricula, você vê a atualização imediatamente
```

## Estrutura de Dados no Firestore

### Coleção: `users`

```json
{
  "uid": "string",
  "email": "tutor@example.com",
  "displayName": "Nome do Tutor",
  "photoURL": "url-da-foto",
  "role": "TUTOR",
  "tutorariosIds": ["cursista1@example.com", "cursista2@example.com"],
  "lastLogin": "timestamp",
  "createdAt": "timestamp"
}
```

**Campo importante**: `tutorariosIds` - Array contendo os e-mails dos cursistas que este tutor acompanha.

### Coleção: `matriculas`

```json
{
  "id": "string",
  "cursistaEmail": "cursista@example.com",
  "cursistaNome": "Nome do Cursista",
  "turmaNome": "Turma A - 2026",
  "fluxo": "EP",
  "status": "CONFIRMADA",
  "EstabExeNome": "Escola Municipal X",
  "anoFormativo": "1 ANO",
  "createdAt": "timestamp"
}
```

## Configuração de Tutores

### Como Vincular um Cursista a um Tutor

Para vincular cursistas a um tutor, você precisa atualizar o documento do tutor no Firestore:

1. **Via Firebase Console**:
   - Acesse Firestore → Coleção `users`
   - Encontre o documento do tutor
   - Edite o campo `tutorariosIds` e adicione os e-mails dos cursistas

2. **Via Código/Script**:
```javascript
// Exemplo com admin SDK
const tutorRef = admin.firestore().collection('users').doc('tutor@example.com');
await tutorRef.update({
  tutorariosIds: admin.firestore.FieldValue.arrayUnion('cursista@example.com')
});
```

3. **Estrutura esperada**:
```json
{
  "tutorariosIds": [
    "cursista1@example.com",
    "cursista2@example.com",
    "cursista3@example.com"
  ]
}
```

## Funcionalidades da Página do Tutor

### ✓ Implementadas
- ✓ Visualização de cursistas vinculados
- ✓ Acompanhamento de matrículas em tempo real
- ✓ Filtro e expansão de detalhes
- ✓ Indicadores de status de matrícula
- ✓ Data/hora de matrícula formatada
- ✓ Informações do estabelecimento de ensino

### 🔄 Futuras Melhorias (Sugestões)
- Relatório em PDF das matrículas dos cursistas
- Filtros por status de matrícula
- Histórico completo de atividades
- Notificações de mudanças de status
- Exportação de dados em CSV
- Busca e filtro por cursista

## Menu de Navegação do Tutor

Quando autenticado como **TUTOR**, o menu lateral mostra:
- **Dashboard** → Página do Tutor (`/tutor`)
- **Sair do Portal** → Logout

O menu é simplificado comparado a outros roles, focando apenas nas funcionalidades essenciais do tutor.

## Fluxo de Acesso

1. Usuário faz login
2. Sistema sincroniza dados via `syncUserSession()`
3. Verifica se o role é "TUTOR"
4. Se sim, redireciona para `/tutor`
5. Carrega lista de cursistas de `tutorariosIds`
6. Configura listeners em tempo real para cada cursista
7. Exibe atualizações automaticamente

## Segurança

- **Regras Firestore**: A página do tutor só acessa dados de cursistas vinculados
- **Validação de Role**: Página valida se o usuário tem role "TUTOR"
- **E-mail como ID**: Documentos de usuário usam e-mail em minúscula como ID único

## Dicas de Uso

1. **Primeira vez**: Certifique-se de que foram adicionados cursistas ao campo `tutorariosIds`
2. **Atualizações em Tempo Real**: Deixe a página aberta para receber notificações automáticas
3. **Múltiplas Matrículas**: Um cursista pode ter múltiplas matrículas (ex: em turmas diferentes)
4. **Status das Matrículas**: 
   - 🟢 **CONFIRMADA**: Matrícula efetivada
   - 🟡 **PENDENTE**: Aguardando confirmação
   - 🔴 **CANCELADA**: Matrícula cancelada

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Página em branco | Verifique se o usuário tem role "TUTOR" no Firestore |
| Nenhum cursista aparece | Confirme que o campo `tutorariosIds` foi preenchido |
| Dados não atualizam | Recarregue a página ou verifique a conexão com Firestore |
| Erro de acesso | Verifique as regras de segurança do Firestore |

## Serviços Relacionados

- **`userService.ts`**: Contém `syncUserSession()` e `getTutoriariosMatriculas()`
- **`AppLayout.tsx`**: Gerencia navegação e exibição de menu por role
- **Firebase Firestore**: Banco de dados em tempo real

---

**Versão**: 1.0
**Última atualização**: Maio 2026
**Status**: Funcionalidade TUTOR operacional
