-- ---------------------------------------------------------------------------
-- Schema do consumidor de Pedidos do marketplace (PostgreSQL).
-- Modelo relacional normalizado. Executado no startup da aplicacao.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cliente (
    id          BIGINT       PRIMARY KEY,          -- customer.id do JSON
    nome        VARCHAR(200) NOT NULL,
    email       VARCHAR(200),
    documento   VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS vendedor (
    id          BIGINT       PRIMARY KEY,          -- seller.id do JSON
    nome        VARCHAR(200) NOT NULL,
    cidade      VARCHAR(120),
    estado      VARCHAR(2)
);

-- Categoria com hierarquia (category -> sub_category) auto-relacionada.
CREATE TABLE IF NOT EXISTS categoria (
    id                  VARCHAR(40)  PRIMARY KEY,  -- category.id / sub_category.id
    nome                VARCHAR(120) NOT NULL,
    id_categoria_pai    VARCHAR(40)  REFERENCES categoria(id)
);

CREATE TABLE IF NOT EXISTS produto (
    id          VARCHAR(60)  PRIMARY KEY,          -- product.id do JSON
    titulo      VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedido (
    id                  BIGSERIAL     PRIMARY KEY,
    uuid                VARCHAR(40)   NOT NULL UNIQUE,     -- order.uuid do JSON
    created_at          TIMESTAMPTZ   NOT NULL,
    channel             VARCHAR(40),
    status              VARCHAR(40),
    total               NUMERIC(14,2) NOT NULL DEFAULT 0,  -- CALCULADO: soma dos itens
    id_cliente          BIGINT        NOT NULL REFERENCES cliente(id),
    id_vendedor         BIGINT        REFERENCES vendedor(id),
    -- rastreabilidade da mensagem Pub/Sub
    pubsub_message_id   VARCHAR(64),
    pubsub_subscription VARCHAR(120),
    payload_json        JSONB,
    indexed_at          TIMESTAMPTZ   NOT NULL DEFAULT now()  -- hora da indexacao na base
);

CREATE TABLE IF NOT EXISTS item_pedido (
    id              BIGSERIAL     PRIMARY KEY,
    id_pedido       BIGINT        NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    seq             INT           NOT NULL,              -- items[].id (ordinal no pedido)
    id_produto      VARCHAR(60)   NOT NULL REFERENCES produto(id),
    id_categoria    VARCHAR(40)   REFERENCES categoria(id),  -- sub_categoria (mais especifica)
    preco_unitario  NUMERIC(14,2) NOT NULL,
    quantidade      INT           NOT NULL,
    total           NUMERIC(14,2) NOT NULL,              -- CALCULADO: preco_unitario * quantidade
    indexed_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (id_pedido, seq)
);

CREATE TABLE IF NOT EXISTS pagamento (
    id              BIGSERIAL   PRIMARY KEY,
    id_pedido       BIGINT      NOT NULL UNIQUE REFERENCES pedido(id) ON DELETE CASCADE,
    metodo          VARCHAR(40),
    status          VARCHAR(40),
    transaction_id  VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS envio (
    id              BIGSERIAL   PRIMARY KEY,
    id_pedido       BIGINT      NOT NULL UNIQUE REFERENCES pedido(id) ON DELETE CASCADE,
    carrier         VARCHAR(60),
    servico         VARCHAR(60),
    status          VARCHAR(40),
    tracking_code   VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS metadata_pedido (
    id              BIGSERIAL   PRIMARY KEY,
    id_pedido       BIGINT      NOT NULL UNIQUE REFERENCES pedido(id) ON DELETE CASCADE,
    source          VARCHAR(60),
    user_agent      VARCHAR(255),
    ip_address      VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS ix_pedido_cliente      ON pedido(id_cliente);
CREATE INDEX IF NOT EXISTS ix_pedido_vendedor     ON pedido(id_vendedor);
CREATE INDEX IF NOT EXISTS ix_item_pedido_pedido  ON item_pedido(id_pedido);
CREATE INDEX IF NOT EXISTS ix_item_pedido_produto ON item_pedido(id_produto);
