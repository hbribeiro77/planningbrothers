# Instruções do Repositório

## Configuração do Git
- Repositório: Planning Brothers (Planning Poker Gamificado)
- Branch principal: main
- Plataforma: GitHub

## Processo de Push

### 1. Verificar status
```bash
git status
```

### 2. Adicionar arquivos modificados
```bash
git add .
```

### 3. Commit com mensagem descritiva
```bash
git commit -m "feat: implementar sistema robusto de reconexão e keep-alive

- Melhorar reconexão automática do Socket.io (tentativas infinitas)
- Implementar grace period de 30s antes de remover participantes
- Adicionar sistema de heartbeat inteligente (20s ativo, 30s inativo)
- Otimizar configurações para Render.com (timeouts < 50s)
- Criar indicador visual de status de conexão
- Adicionar endpoints de health check (/api/health, /api/ping)
- Implementar keep-alive externo automático para produção
- Adicionar re-entrada automática na sala após reconexão
- Preservar estado do usuário (vida, moedas, inventário) durante reconexões"
```

### 4. Push para repositório remoto
```bash
git push origin main
```

## Notas
- Sempre verificar se não há conflitos antes do push
- Usar mensagens de commit descritivas seguindo padrão conventional commits
- Testar localmente antes de fazer push

