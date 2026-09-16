# Pub/Sub Consumer + Orders API + Dashboard

Projeto de demonstração de um pipeline de pedidos em que uma aplicação Java consome mensagens do Google Cloud Pub/Sub, persiste os dados em PostgreSQL e expõe a informação em uma API REST e em um frontend web para consulta e visualização.

## Visão geral

O projeto é dividido em 3 partes principais:

- `consumer/`: consumidor Java em Pub/Sub, responsável por receber mensagens de pedidos, normalizar o payload e salvar tudo no banco de dados.
- `orders-api/`: API REST em Node.js + TypeScript para consultar pedidos e sumarizações financeiras.
- `orders-web/`: frontend em React + Vite para visualizar pedidos, dashboard e playground da API.

O fluxo principal é:

1. Uma mensagem de pedido chega ao Pub/Sub.
2. O `consumer` lê a mensagem.
3. O payload é processado e salvo em tabelas normalizadas no PostgreSQL.
4. A `orders-api` consulta esse banco para retornar dados estruturados.
5. O `orders-web` consome a API e exibe graficos, filtros, listagem e detalhes.

---

## Estrutura do projeto

```text
pubsub-consumer/
├── consumer/
│   ├── pom.xml
│   ├── samples/
│   │   └── pedido-exemplo.json
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   └── resources/
│       │       └── schema.sql
├── orders-api/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   └── tests/
├── orders-web/
│   ├── package.json
│   ├── src/
│   └── index.html
├── docs/
│   └── Nuvem - Atividade Mensageria 2026.pdf
│   └── schema.svg
└── README.md
```

---

## Tecnologias

### Consumer (Java)

- Java 17
- Maven
- Google Cloud Pub/Sub
- PostgreSQL JDBC Driver
- Jackson
- SLF4J

### API (Node.js)

- Node.js >= 18
- TypeScript
- Express
- PostgreSQL (`pg`)
- Zod
- Vitest

### Web (React)

- React 18
- TypeScript
- Vite
- React Router DOM
- TanStack Query

---

## Pré-requisitos

Antes de rodar o projeto, verifique se você tem:

- Java 17 instalado
- Maven instalado
- Node.js 18+ e npm/yarn
- PostgreSQL em execução
- Google Cloud project com Pub/Sub configurado
- Credenciais de autenticação do Pub/Sub configuradas localmente

---

## Banco de dados

O consumidor cria e valida o schema ao iniciar, usando o arquivo `consumer/src/main/resources/schema.sql`.

O projeto espera uma instância local ou acessível de PostgreSQL com um banco e credenciais configurados no ambiente.

> O comportamento do consumer usa as variáveis `DB_URL`, `DB_USER`, `DB_PASSWORD`, `PUBSUB_PROJECT_ID` e `PUBSUB_SUBSCRIPTION_ID`.

---

## Variáveis de ambiente

### Consumer Java

Defina apenas as variáveis essenciais para execução local:

```bash
PUBSUB_PROJECT_ID=<seu-project-id>
PUBSUB_SUBSCRIPTION_ID=<sua-subscription>
DB_URL=jdbc:postgresql://<host>:<porta>/<database>
DB_USER=<usuario-db>
DB_PASSWORD=<senha-db>
```

Também é necessário configurar a autenticação do Google Cloud:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/sua/credencial.json"
```

### API Node

A API usa as variáveis mínimas do banco e da porta:

```bash
PORT=<porta-da-api>
DB_URL=postgresql://<host>:<porta>/<database>
DB_USER=<usuario-db>
DB_PASSWORD=<senha-db>
```

### Frontend

Se quiser apontar o frontend para outra API, configure apenas a URL base:

```bash
VITE_API_BASE_URL=http://localhost:<porta-da-api>
```

---

## Como executar

### 1) Subir o banco

Certifique-se de que o PostgreSQL está ativo e que o banco `marketplace` existe com as credenciais esperadas.

### 2) Rodar o consumer Java

```bash
cd consumer
mvn clean package
mvn exec:java
```

O consumidor ficará ouvindo a subscription do Pub/Sub até você interromper com `Ctrl+C`.

### 3) Rodar a API

```bash
cd orders-api
npm install
cp .env.example .env
npm run dev
```

A API fica disponível em:

```text
http://localhost:3000
```

### 4) Rodar o frontend

```bash
cd orders-web
npm install
npm run dev
```

A aplicação web fica disponível em:

```text
http://localhost:5173
```

---

## Endpoints da API

A API expõe rotas relacionadas a pedidos:

- `GET /orders` — lista pedidos com paginação, filtros e ordenação
- `GET /orders/:uuid` — busca um pedido pelo UUID
- `GET /orders/:uuid/items` — busca os itens de um pedido
- `GET /orders/financial-summary` — resumo financeiro por filtros

Exemplos:

```bash
curl "http://localhost:3000/orders?page=1&page_size=10"
curl "http://localhost:3000/orders/ORD-2025-0001"
curl "http://localhost:3000/orders/financial-summary?status=paid"
```

---

## Dados de exemplo

Há um payload de exemplo em:

- `consumer/samples/pedido-exemplo.json`

Esse arquivo pode ser usado para testar o consumo do Pub/Sub ou validar o parser do consumidor.

---

## Testes

### API

```bash
cd orders-api
npm test
```

Também é possível rodar validação TypeScript:

```bash
cd orders-api
npm run lint
```

### Frontend

```bash
cd orders-web
npm run build
```

---

## Observações importantes

- O consumidor é o responsável por popular o banco de dados.
- A API não escreve diretamente em pedidos; ela apenas consulta os dados já persistidos.
- O frontend é uma interface para explorar a API e a base de dados da demonstração.
- O schema do banco e a lógica de persistência ficam em `consumer/src/main/resources/schema.sql` e em classes Java do pacote `br.com.fatec.pubsub`.

---

## Fluxo prático recomendado

1. Configure o PostgreSQL local.
2. Configure o Google Cloud Pub/Sub e a credencial.
3. Inicie o `consumer`.
4. Envie uma mensagem válida para a subscription.
5. Confirme que o pedido foi gravado no banco.
6. Inicie a API.
7. Inicie o frontend.
8. Explore os dados em dashboard e listagem.