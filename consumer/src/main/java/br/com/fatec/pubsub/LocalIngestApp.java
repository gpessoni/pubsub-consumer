package br.com.fatec.pubsub;

import br.com.fatec.pubsub.model.Pedido;
import br.com.fatec.pubsub.model.PedidoMapper;
import br.com.fatec.pubsub.persistence.Db;
import br.com.fatec.pubsub.persistence.PedidoRepository;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Ingestao local de um arquivo JSON de Pedido usando exatamente o mesmo caminho
 * de persistencia do consumidor Pub/Sub. Serve para demonstrar a gravacao no
 * banco sem depender de uma mensagem publicada ao vivo.
 *
 * <p>Uso: {@code mvn -q compile exec:java -Dexec.mainClass=br.com.fatec.pubsub.LocalIngestApp -Dexec.args="samples/pedido-exemplo.json"}
 */
public class LocalIngestApp {

  public static void main(String[] args) throws Exception {
    String path = args.length > 0 ? args[0] : "samples/pedido-exemplo.json";

    Config cfg = Config.fromEnv();
    Db db = new Db(cfg);
    db.initSchema();

    PedidoRepository repo = new PedidoRepository(db);

    String json = Files.readString(Path.of(path));
    Pedido pedido = PedidoMapper.fromJson(json);

    long id =
        repo.salvar(pedido, "local-" + System.currentTimeMillis(), "local-ingest", json);

    System.out.printf(
        "Pedido %s gravado: id=%d, itens=%d, total calculado=%s%n",
        pedido.uuid(), id, pedido.itens().size(), pedido.total());
    for (Pedido.Item it : pedido.itens()) {
      System.out.printf(
          "  item seq=%d produto=%s qtd=%d preco=%s total=%s%n",
          it.seq(), it.produto().id(), it.quantidade(), it.precoUnitario(), it.total());
    }
  }
}
