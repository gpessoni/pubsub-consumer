# Orders Web

Frontend em React + TypeScript para visualizar pedidos, métricas e explorar a API do projeto.

## Objetivo

Esse módulo oferece uma interface web para:

- listar pedidos
- ver detalhes de um pedido
- consultar dashboard com indicadores
- testar endpoints da API
- acompanhar mensagens em tempo real

## Estrutura principal

```text
orders-web/
├── index.html
├── package.json
├── src/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   ├── types/
│   └── utils/
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── package-lock.json
```

## Tecnologias

- React 18
- TypeScript
- Vite
- React Router DOM
- TanStack Query

## Pré-requisitos

- Node.js 18+
- npm
- API `orders-api` em execução

## Variáveis de ambiente

Para apontar o frontend para a API correta, configure a URL base:

```bash
VITE_API_BASE_URL=http://localhost:<porta-da-api>
```

## Instalação

```bash
npm install
```

## Execução em desenvolvimento

```bash
npm run dev
```

A aplicação é servida normalmente em:

```text
http://localhost:5173
```

## Build de produção

```bash
npm run build
```

## Páginas principais

- Dashboard
- Lista de pedidos
- Detalhe do pedido
- Live Messages
- API Playground

## Observação

O frontend depende da API estar rodando e conectada ao mesmo banco alimentado pelo consumer.
