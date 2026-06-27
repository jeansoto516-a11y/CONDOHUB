# CondoHub

SaaS para gestao de condominios com backend PHP e frontend em JavaScript puro.

## Recursos

- Login administrativo com sessao PHP.
- Dashboard com indicadores de condominios, moradores, chamados, reservas e encomendas.
- Cadastro e listagem de condominios.
- Cadastro e listagem de moradores.
- Chamados de manutencao, seguranca, financeiro e outros.
- Avisos para condominios.
- Controle de encomendas.
- Reservas de areas comuns.
- Banco SQLite criado automaticamente na primeira execucao.

## Acesso inicial

- Email: `admin@condohub.com`
- Senha: `123456`

## Como rodar

Instale o PHP com a extensao SQLite habilitada. Depois rode:

```bash
cd Backend/public
php -S 127.0.0.1:8000 index.php
```

Abra `http://127.0.0.1:8000` no navegador.

Se usar XAMPP, Laragon ou Apache, aponte o document root para `Backend/public`.
