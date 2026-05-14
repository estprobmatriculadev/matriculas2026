# Guia Operacional - Perfil TÉCNICO
## Plataforma Institucional de Matrículas 2026 (EP & PEDFOR)

### 1. Visão Geral
O Técnico é o motor operacional da plataforma. Suas principais responsabilidades incluem a manutenção da base de dados, a análise de solicitações de cursistas e a gestão de documentos oficiais.

### 2. Importação de Dados (CSV)
A plataforma permite a alimentação em lote de cursistas e turmas.
*   **Procedimento**: O técnico deve realizar o upload de um arquivo CSV. 
*   **Validação e Preview**: Antes da gravação definitiva no Firestore, o sistema exibe uma prévia dos dados para conferência de nomes, vínculos e modalidades.
*   **Processamento**: Após a confirmação, o sistema realiza gravações em lote (batch writes) para garantir a integridade.

### 3. Central de Remanejamento (Aprovações)
O técnico atua como juiz nas trocas de turmas solicitadas pelos cursistas.
*   **Fila de Trabalho**: Solicitações chegam com o status "PENDENTE".
*   **Análise**: O técnico visualiza a turma de origem, a de destino e a justificativa do professor.
*   **Decisão (Deferir/Indeferir)**:
    *   **Deferido**: A troca é automática. O sistema ajusta as vagas transacionalmente (aumenta na origem, diminui no destino) e notifica o professor.
    *   **Indeferido**: O professor mantém sua turma original e recebe o motivo da negativa.

### 4. Gestão de Documentos Oficiais
Substituindo a antiga biblioteca, esta seção permite que o técnico disponibilize editais, manuais e cronogramas.
*   **Armazenamento**: Os arquivos residem no Google Drive institucional, sendo apenas linkados via Firestore para garantir rapidez no acesso.

### 5. Auditoria e Logs
Todas as ações do técnico (importações, aprovações, exclusões) são registradas na coleção de logs para posterior análise no Looker Studio.
