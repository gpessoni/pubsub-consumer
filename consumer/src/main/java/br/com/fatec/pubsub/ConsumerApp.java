package br.com.fatec.pubsub;

import br.com.fatec.pubsub.model.Pedido;
import br.com.fatec.pubsub.model.PedidoMapper;
import br.com.fatec.pubsub.persistence.Db;
import br.com.fatec.pubsub.persistence.PedidoRepository;
import com.google.cloud.pubsub.v1.AckReplyConsumer;
import com.google.cloud.pubsub.v1.MessageReceiver;
import com.google.cloud.pubsub.v1.Subscriber;
import com.google.pubsub.v1.ProjectSubscriptionName;
import com.google.pubsub.v1.PubsubMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Consumidor Google Cloud Pub/Sub: recebe as mensagens de Pedido da subscription,
 * calcula os totais e persiste no PostgreSQL (tabelas pedido, cliente, produto,
 * item_pedido, vendedor, categoria, pagamento, envio, metadata_pedido).
 *
 * <p>Autenticacao Pub/Sub: variavel {@code GOOGLE_APPLICATION_CREDENTIALS}
 * apontando para o {@code sa-grupo-a-key.json}.
 */
public class ConsumerApp {

  private static final Logger log = LoggerFactory.getLogger(ConsumerApp.class);

  public static void main(String... args) throws Exception {
    Config cfg = Config.fromEnv();

    Db db = new Db(cfg);
    db.initSchema();
    log.info("Schema verificado/criado em {}", cfg.dbUrl());

    PedidoRepository repo = new PedidoRepository(db);

    ProjectSubscriptionName subscriptionName =
        ProjectSubscriptionName.of(cfg.projectId(), cfg.subscriptionId());

    MessageReceiver receiver = buildReceiver(repo, cfg.subscriptionId());

    Subscriber subscriber = null;
    try {
      subscriber = Subscriber.newBuilder(subscriptionName, receiver).build();
      subscriber.startAsync().awaitRunning();
      log.info(
          "Consumidor ativo em {}/{} - aguardando mensagens (Ctrl+C para encerrar)",
          cfg.projectId(),
          cfg.subscriptionId());
      subscriber.awaitTerminated();
    } finally {
      if (subscriber != null) {
        subscriber.stopAsync();
      }
    }
  }

  static MessageReceiver buildReceiver(PedidoRepository repo, String subscriptionId) {
    return (PubsubMessage message, AckReplyConsumer consumer) -> {
      String payload = message.getData().toStringUtf8();
      try {
        Pedido pedido = PedidoMapper.fromJson(payload);
        long id = repo.salvar(pedido, message.getMessageId(), subscriptionId, payload);
        log.info(
            "Pedido {} persistido (id={}, itens={}, total calculado={})",
            pedido.uuid(),
            id,
            pedido.itens().size(),
            pedido.total());
        consumer.ack();
      } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
        // payload invalido: nao adianta reentregar -> ack para descartar
        log.error("Mensagem {} com JSON invalido, descartada: {}", message.getMessageId(), e.toString());
        consumer.ack();
      } catch (Exception e) {
        // falha transitoria (ex.: banco indisponivel) -> nack para reentrega
        log.error("Falha ao persistir mensagem {} (nack): {}", message.getMessageId(), e.toString(), e);
        consumer.nack();
      }
    };
  }
}
