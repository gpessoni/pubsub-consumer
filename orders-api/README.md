# Orders API

API REST em Node.js + TypeScript para consultar pedidos armazenados no PostgreSQL e gerar resumos financeiros.

## Objetivo

Essa API expõe os dados gerados pelo consumer para uso em dashboards, listagem de pedidos, detalhes e consulta de indicadores de negócio.

## Estrutura principal

```text
orders-api/
├── .env.example
├── package.json
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── db/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── validation/
│   └── types/
├── tests/
└── vitest.config.ts
```

## Tecnologias

- Node.js >= 18
- TypeScript
- Express
- PostgreSQL (`pg`)
- Zod
- Vitest

## Pré-requisitos

- Node.js 18+
- npm
- PostgreSQL em execução
- Banco já alimentado pelo consumer

## Variáveis de ambiente

Crie um arquivo `.env` com o mínimo necessário:

```bash
PORT=<porta-da-api>
DB_URL=postgresql://<host>:<porta>/<database>
DB_USER=<usuario-db>
DB_PASSWORD=<senha-db>
```

Também pode usar o arquivo de exemplo:

```bash
cp .env.example .env
```

## Instalação

```bash
npm install
```

## Execução em desenvolvimento

```bash
npm run dev
```

A API fica disponível geralmente em:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Testes

```bash
npm test
```

Validação de tipos:

```bash
npm run lint
```

## Endpoints principais

### Lista de pedidos

```http
GET /orders
```

Suporta paginação, filtros e ordenação.

### Detalhe de pedido

```http
GET /orders/:uuid
```

### Itens de um pedido

```http
GET /orders/:uuid/items
```

### Resumo financeiro

```http
GET /orders/financial-summary
```

## Observação

Esta API lê os dados do banco e não persiste pedidos diretamente; a origem dos dados é o consumer Java.
