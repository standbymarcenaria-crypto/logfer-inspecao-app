# Logfer | App de Inspeção Semanal de Caminhões

Versão 2 do MVP do sistema de inspeção semanal de caminhões da Logfer.

## O que funciona nesta versão

- Abre no celular pelo navegador.
- Pode ser instalado como PWA na tela inicial.
- Motorista preenche dados da inspeção.
- Checklist baseado na ficha final da Logfer.
- Campos de observação e foto para não conformidades.
- Foto obrigatória em itens críticos.
- Assinatura do motorista na tela.
- Painel local do gestor.
- Registro de medida corretiva, status do gestor e data de liberação.
- Exportação CSV para conferência inicial.

## Limitação desta etapa

Os dados ainda ficam salvos no próprio aparelho, via localStorage do navegador.
Isso é adequado apenas para teste. Para uso real, será necessário conectar ao Supabase.

## Próxima fase

1. Criar projeto no Supabase.
2. Rodar o arquivo supabase-schema.sql.
3. Preencher config.js com URL e chave anônima do Supabase.
4. Criar login real de motoristas e gestores.
5. Salvar fotos no Supabase Storage.

## Arquivos principais

- index.html: estrutura das telas.
- styles.css: aparência do sistema.
- app.js: regras da inspeção.
- config.js: conexão futura com Supabase.
- manifest.json e service-worker.js: instalação como PWA.
- supabase-schema.sql: modelo inicial de banco de dados.
