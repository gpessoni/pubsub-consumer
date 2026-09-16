# Consumer Java

Consumidor responsável por receber mensagens do Google Cloud Pub/Sub, processar o payload de pedidos e persistir os dados em PostgreSQL.

## Objetivo

Este módulo lê mensagens de pedidos, transforma o JSON em objetos do domínio, salva as entidades normalizadas e registra a origem da mensagem no banco.

## Estrutura principal

```text
consumer/
├── pom.xml
├── samples/
│   └── pedido-exemplo.json
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── br/com/fatec/pubsub/
│   │   └── resources/
│   │       └── schema.sql
└── target/
```

## Tecnologias

- Java 17
- Maven
- Google Cloud Pub/Sub
- PostgreSQL JDBC
- Jackson
- SLF4J

## Pré-requisitos

- Java 17 instalado
- Maven instalado
- PostgreSQL acessível
- Projeto GCP com Pub/Sub configurado
- Credencial Google Cloud válida configurada no ambiente

## Variáveis de ambiente

Crie as variáveis essenciais no ambiente antes de executar:

```bash
PUBSUB_PROJECT_ID=<id-do-projeto-gcp>
PUBSUB_SUBSCRIPTION_ID=<nome-da-subscription>
DB_URL=jdbc:postgresql://<host>:<porta>/<database>
DB_USER=<usuario-do-banco>
DB_PASSWORD=<senha-do-banco>
```

Autenticação do Google Cloud:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/sua/credencial.json"
```

## Execução

Na pasta `consumer`:

```bash
mvn clean package
mvn exec:java
```

O aplicativo entra em modo de consumo e fica aguardando mensagens da subscription configurada.

## Comportamento

- valida e cria o schema automaticamente ao iniciar
- lê mensagens do Pub/Sub
- converte o JSON para o modelo `Pedido`
- grava dados em tabelas normalizadas
- faz `ack` quando a mensagem for processada com sucesso
- faz `nack` quando houver falha transitória

## Arquivo de schema

O schema está em:

- `consumer/src/main/resources/schema.sql`

Ele cria as tabelas de cliente, vendedor, categoria, produto, pedido, itens, pagamento, envio e metadata.

## Dados de exemplo

Existe um payload de exemplo em:

- `consumer/samples/pedido-exemplo.json`

Esse arquivo pode ser usado para testar o consumo e validar o parsing.

## Observação

Este módulo é responsável por alimentar o banco que será consultado pela API e pelo frontend.
