# Visão Estratégica - Perfil ADMINISTRADOR
## Governança da Plataforma de Matrículas 2026

### 1. Arquitetura Híbrida
A plataforma utiliza uma arquitetura moderna para maximizar a estabilidade e custo zero:
*   **Firebase Firestore**: Banco de dados operacional para transações rápidas e escaláveis (até 8000 cursistas).
*   **Google Apps Script**: Middleware para integração institucional (Drive, Gmail, Sheets).
*   **BigQuery**: Camada analítica para BI e consolidação de dados de anos anteriores.

### 2. Gestão de Segurança e Perfis
O Administrador tem poder total sobre a coleção `users` no Firestore.
*   Pode elevar usuários cursistas para o perfil de **Técnico** ou **Admin**.
*   Monitora logs de auditoria para garantir a transparência do processo de remanejamento.

### 3. Regras de Negócio Institucionais
O Admin é responsável por definir os parâmetros que governam a plataforma:
*   **EP**: Configuração de datas de corte para o cálculo do Ano Formativo.
*   **PEDFOR**: Monitoramento da cota de uma vaga por escola (`EstabExeNome`).

### 4. Integração Analítica (Data Studio / Looker Studio)
Diferente dos perfis operacionais, o Admin foca na análise macro.
*   Os dados de matrículas e remanejamentos são exportados via Apps Script ou integrados diretamente do BigQuery para dashboards no Looker Studio.
*   Filtros recomendados: Ocupação por NRE, Vagas por Município e Distribuição por Componente Curricular.

### 5. Escalabilidade e Manutenção
O sistema foi desenhado para suportar picos de acesso durante a abertura de janelas de matrícula, utilizando transações atômicas para impedir a sobreposição de vagas, um problema crítico nas versões legadas em Apps Script.
