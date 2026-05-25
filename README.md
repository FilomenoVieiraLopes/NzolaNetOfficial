# NzolaNet API

NzolaNet e uma API Laravel para uma rede social academica. A aplicacao permite registo e autenticacao de utilizadores, gestao de perfis, publicacoes com texto/imagem/video, comentarios, bazes, feed de noticias, seguidores e notificacoes.

Este repositorio contem o backend. O frontend Angular deve consumir os endpoints documentados em [docs/API.md](docs/API.md) e seguir o guia de integracao em [docs/ANGULAR.md](docs/ANGULAR.md).

## Documentacao

- [Arquitetura e requisitos](docs/ARCHITECTURE.md)
- [Endpoints da API](docs/API.md)
- [Guia para ligar com Angular](docs/ANGULAR.md)

## Stack tecnica

- PHP 8.3+
- Laravel 13
- Laravel Sanctum para autenticacao por token
- MySQL, PostgreSQL ou outro banco suportado pelo Laravel
- Vite apenas para assets base do Laravel

## Funcionalidades principais

- Registo, login, logout e recuperacao de senha.
- Edicao de perfil, avatar e privacidade (`public` ou `private`).
- Seguir e deixar de seguir utilizadores.
- Criar, listar, editar e apagar publicacoes proprias.
- Upload de imagem e video em publicacoes.
- Dar/remover bazes em publicacoes.
- Criar, listar, editar e apagar comentarios.
- Moderacao: utilizador `admin` pode apagar comentarios de outros utilizadores.
- Feed principal e feed de utilizadores seguidos.
- Notificacoes para follow, baze e comentario.

## Instalar localmente

1. Instalar dependencias PHP:

```bash
composer install
```

2. Instalar dependencias Node:

```bash
npm install
```

3. Criar o ficheiro `.env`:

```bash
copy .env.example .env
```

4. Gerar a chave da aplicacao:

```bash
php artisan key:generate
```

5. Configurar o banco no `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nzolanet
DB_USERNAME=root
DB_PASSWORD=
```

6. Executar migrations:

```bash
php artisan migrate
```

7. Criar o link publico para uploads:

```bash
php artisan storage:link
```

8. Subir o servidor:

```bash
php artisan serve
```

Por padrao, a API fica em:

```text
http://127.0.0.1:8000/api
```

## Autenticacao

Os endpoints protegidos usam token Sanctum. Depois de login ou registo, o backend devolve:

```json
{
  "token": "1|token..."
}
```

No Angular, envie esse token nos requests protegidos:

```http
Authorization: Bearer 1|token...
```

## Testes

Executar:

```bash
php artisan test
```

Nota: o `phpunit.xml` usa SQLite em memoria para testes. Se o PHP local nao tiver `pdo_sqlite`/`sqlite3`, a suite falha com `could not find driver`. Nesse caso, instale/ative a extensao SQLite do PHP ou ajuste o ambiente de testes para MySQL.

## Estrutura resumida

```text
app/
  DTOs/          Objetos de entrada/saida da API
  Http/Controllers/  Recebem requests e devolvem respostas JSON
  Interfaces/    Contratos para services e repositories
  Models/        Modelos Eloquent e relacoes
  Providers/     Bindings de injecao de dependencia
  Repositories/  Acesso a base de dados
  Services/      Regras de negocio
routes/api.php   Rotas REST da API
database/migrations/ Estrutura do banco
tests/Feature/  Testes dos endpoints principais
```

## Observacoes de seguranca

- Nunca subir `.env` para o GitHub.
- Nunca guardar senhas em texto puro.
- Tokens devem ser guardados no frontend de forma cuidadosa.
- Uploads aceitam apenas tipos e tamanhos definidos nos controllers.
- Perfis privados so podem ser vistos pelo dono ou por seguidores.
