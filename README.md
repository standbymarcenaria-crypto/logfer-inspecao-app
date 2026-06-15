# Logfer | App de Inspeção Semanal de Caminhões

Este é o MVP inicial do sistema de inspeção de caminhões da Logfer.

## O que já funciona

- Abre no celular pelo navegador.
- Pode ser instalado como PWA na tela inicial.
- Preenche dados do motorista, CNH, placa, odômetro e tipo de veículo.
- Checklist baseado na ficha atual da Logfer.
- Obriga observação e foto nos itens críticos marcados como “Não conforme”.
- Coleta assinatura na tela.
- Salva em modo local no aparelho quando o Supabase ainda não está configurado.
- Possui painel simples do gestor no modo local.

## Arquivos principais

- `index.html`: estrutura da tela.
- `styles.css`: visual do aplicativo.
- `app.js`: lógica do checklist, fotos, assinatura e salvamento.
- `config.js`: local para colocar URL e chave pública do Supabase.
- `manifest.json`: transforma em aplicativo instalável.
- `service-worker.js`: cache básico para PWA.
- `supabase-schema.sql`: script para criar as tabelas no Supabase.

## Passo a passo para publicar no GitHub Pages

1. Entre em https://github.com
2. Clique em **New repository**.
3. Nome sugerido: `logfer-inspecao-caminhoes`.
4. Marque como **Public** para usar GitHub Pages grátis.
5. Clique em **Create repository**.
6. Clique em **uploading an existing file**.
7. Envie todos os arquivos desta pasta.
8. Clique em **Commit changes**.
9. Vá em **Settings**.
10. Clique em **Pages**.
11. Em **Build and deployment**, selecione:
    - Source: **Deploy from a branch**
    - Branch: **main**
    - Folder: **/root**
12. Clique em **Save**.
13. Aguarde o GitHub gerar o link.

## Passo a passo para criar o Supabase

1. Entre em https://supabase.com
2. Crie uma conta gratuita.
3. Clique em **New project**.
4. Crie o projeto `logfer-inspecao`.
5. Vá em **SQL Editor**.
6. Clique em **New query**.
7. Cole o conteúdo do arquivo `supabase-schema.sql`.
8. Clique em **Run**.
9. Vá em **Project Settings > API**.
10. Copie:
    - Project URL
    - anon public key
11. Abra o arquivo `config.js`.
12. Preencha:

```js
window.LOGFER_CONFIG = {
  SUPABASE_URL: "cole_a_url_aqui",
  SUPABASE_ANON_KEY: "cole_a_chave_anon_aqui"
};
```

13. Envie o `config.js` atualizado para o GitHub.

## Próxima evolução recomendada

- Login real para motorista e gestor.
- Cadastro de caminhões.
- Cadastro de motoristas.
- Painel do gestor lendo dados do Supabase.
- Relatório por caminhão.
- Relatório por reincidência de defeitos.
- Controle de medida corretiva e data de liberação do veículo.
