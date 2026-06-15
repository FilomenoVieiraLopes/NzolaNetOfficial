# NzolaNet API

Backend Laravel da rede social NzolaNet. A API concentra autenticacao, regras de negocio, persistencia, uploads, notificacoes e feed.

## Stack tecnica

- PHP 8.3+
- Laravel
- Laravel Sanctum para autenticacao por token
- MySQL
- Eloquent ORM
- Arquitetura em camadas com Controllers, DTOs, Services, Repositories e Interfaces

## Funcionalidades

- Autenticacao: registo, login, logout e recuperacao de senha.
- Utilizadores: perfil, avatar, capa, bio, privacidade e pesquisa.
- Privacidade: perfis publicos permitem seguir na hora; perfis privados exigem pedido pendente e aceitacao.
- Seguidores: seguir, deixar de seguir, aceitar e rejeitar pedidos.
- Publicacoes: criar, listar, ver detalhe, editar e apagar.
- Multimidia: upload de imagens e videos.
- Feed: geral, personalizado por pessoas seguidas e ordenacao cronologica.
- Bazes: dar/remover em publicacoes e comentarios, impedindo duplicacao.
- Comentarios: criar, listar, editar e apagar.
- Notificacoes: geradas para baze, comentario e novo seguidor.
- Actualizacao dinamica: o frontend consulta a API periodicamente por polling.
- Testes: suite Feature cobrindo endpoints principais.

## Estrutura

```text
app/
  DTOs/              Entrada e saida padronizada da API
  Http/Controllers/  Recebem requests e devolvem JSON
  Interfaces/        Contratos de services e repositories
  Models/            Modelos Eloquent e relacoes
  Providers/         Bindings de injecao de dependencia
  Repositories/      Acesso ao banco de dados
  Services/          Regras de negocio
database/
  migrations/        Estrutura das tabelas
  seeders/           Dados iniciais
routes/
  api.php            Endpoints REST
tests/
  Feature/           Testes dos fluxos principais da API
```

## Configuracao local

1. Instalar dependencias:

```bash
composer install
npm install
```

2. Criar `.env`:

```bash
copy .env.example .env
php artisan key:generate
```

3. Configurar MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nzolanet
DB_USERNAME=root
DB_PASSWORD=
```

4. Configurar broadcast desligado no `.env`:

```env
BROADCAST_CONNECTION=null
```

5. Preparar banco e uploads:

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

## Executar

Servidor HTTP:

```bash
php artisan serve
```

Tudo em conjunto:

```bash
composer run dev
```

Esse comando sobe o servidor HTTP da API.

Para upload de videos, use esse comando ou suba o servidor com limites PHP maiores:

```bash
php -d upload_max_filesize=64M -d post_max_size=64M -d memory_limit=256M artisan serve
```

O Laravel valida videos ate 50MB, mas o PHP precisa permitir requests acima desse tamanho antes da validacao da API.

## Autenticacao

Depois de login ou registo, a API devolve um token Sanctum:

```json
{
  "token": "1|token..."
}
```

Todos os endpoints protegidos devem receber:

```http
Authorization: Bearer 1|token...
Accept: application/json
```

O frontend guarda o token no `localStorage` e o interceptor Angular adiciona o header automaticamente.

## Expiracao dos tokens

Os tokens Sanctum expiram automaticamente conforme o valor:

```env
SANCTUM_TOKEN_EXPIRATION=120
```

O valor e definido em minutos. Com `120`, cada token e considerado expirado apos 2 horas desde a criacao. Quando isso acontece, a API devolve `401` e o frontend limpa a sessao local, mostra aviso de sessao expirada e redirecciona para o login.

Se alterar esse valor em ambiente local ou producao, limpe a cache de configuracao:

```bash
php artisan config:clear
```

## Testes

Os testes usam MySQL. Crie uma base separada para testes, por exemplo:

```sql
CREATE DATABASE nzolanet_test;
```

Configure o ambiente de teste conforme o `phpunit.xml` e execute:

```bash
php artisan test
```

## Documentacao complementar

- [Arquitetura e requisitos](docs/ARCHITECTURE.md)
- [Endpoints da API](docs/API.md)
- [Guia de integracao com Angular](docs/ANGULAR.md)

## Cuidados

- Nao versionar `.env`.
- Executar `php artisan storage:link` para imagens e videos carregarem.
- As notificacoes e o feed dinamico sao actualizados pelo frontend com polling.
- Em producao, ajustar `SANCTUM_TOKEN_EXPIRATION` conforme a politica de seguranca desejada.
