# Subir projeto no GitHub (SSH)

O repositório Git já está inicializado e o primeiro commit foi feito. A conexão SSH com o GitHub está funcionando (usuário: **Gustavocostad**).

## Passo 1: Criar o repositório no GitHub

1. Acesse: **https://github.com/new**
2. **Repository name:** `valida-lead-campanha-huggy` (ou outro nome que preferir)
3. Deixe **Private** ou **Public** como quiser
4. **Não** marque "Add a README", "Add .gitignore" nem "Choose a license"
5. Clique em **Create repository**

## Passo 2: Conectar e enviar o código

Se você usou o nome `valida-lead-campanha-huggy`:

```bash
cd /opt/valida_lead_campanha_huggy
git push -u origin main
```

Se criou com **outro nome**, ajuste o remote e depois faça o push:

```bash
cd /opt/valida_lead_campanha_huggy
git remote set-url origin git@github.com:Gustavocostad/SEU-NOME-DO-REPO.git
git push -u origin main
```

## Resumo do que já está feito

- `git init` e branch `main`
- `.gitignore` configurado (`.env` não é enviado)
- Primeiro commit com todos os arquivos do projeto
- Remote `origin` apontando para: `git@github.com:Gustavocostad/valida-lead-campanha-huggy.git`
- Chave SSH `~/.ssh/id_ed25519_github` já configurada para o GitHub
