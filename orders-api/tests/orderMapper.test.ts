import { describe, expect, it } from "vitest";
import { assembleOrder, buildCategory, buildOrderItem, calculateOrderTotal } from "../src/mappers/orderMapper";
import { OrderHeaderRow, OrderItemRow } from "../src/repositories/orderRepository";

function makeItemRow(overrides: Partial<OrderItemRow> = {}): OrderItemRow {
  return {
    id_pedido: 1,
    seq: 1,
    preco_unitario: "2500.00",
    quantidade: 2,
    product_id: "abc-1344",
    product_title: "televisao bonita",
    sub_cat_id: "PHONE",
    sub_cat_name: "Smartphones",
    parent_cat_id: "ELEC",
    parent_cat_name: "Eletrônicos",
    ...overrides,
  };
}

describe("buildOrderItem", () => {
  it("calcula o total do item como unit_price * quantity", () => {
    const item = buildOrderItem(makeItemRow({ preco_unitario: "2500.00", quantidade: 2 }));
    expect(item.unit_price).toBe(2500);
    expect(item.quantity).toBe(2);
    expect(item.total).toBe(5000);
  });

  it("arredonda para 2 casas decimais evitando ruido de ponto flutuante", () => {
    const item = buildOrderItem(makeItemRow({ preco_unitario: "10.1", quantidade: 3 }));
    expect(item.total).toBe(30.3);
  });

  it("reconstroi category/sub_category a partir da hierarquia", () => {
    const item = buildOrderItem(makeItemRow());
    expect(item.category).toEqual({
      id: "ELEC",
      name: "Eletrônicos",
      sub_category: { id: "PHONE", name: "Smartphones" },
    });
  });

  it("usa a categoria armazenada como topo quando nao ha categoria pai", () => {
    const item = buildOrderItem(
      makeItemRow({ sub_cat_id: "ELEC", sub_cat_name: "Eletrônicos", parent_cat_id: null, parent_cat_name: null })
    );
    expect(item.category).toEqual({ id: "ELEC", name: "Eletrônicos" });
  });

  it("retorna category null quando o item nao tem categoria", () => {
    const item = buildOrderItem(makeItemRow({ sub_cat_id: null, sub_cat_name: null }));
    expect(item.category).toBeNull();
  });
});

describe("buildCategory", () => {
  it("retorna null quando nao ha sub_cat_id", () => {
    expect(buildCategory(makeItemRow({ sub_cat_id: null }))).toBeNull();
  });
});

describe("calculateOrderTotal", () => {
  it("soma o total de todos os items", () => {
    const items = [
      buildOrderItem(makeItemRow({ seq: 1, preco_unitario: "2500.00", quantidade: 2 })),
      buildOrderItem(makeItemRow({ seq: 2, preco_unitario: "99.90", quantidade: 3 })),
    ];
    expect(calculateOrderTotal(items)).toBe(5299.7);
  });

  it("retorna 0 para pedido sem items", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
});

describe("assembleOrder", () => {
  const header: OrderHeaderRow = {
    id: 1,
    uuid: "ORD-2025-0001",
    created_at: new Date("2025-10-01T10:15:00Z"),
    channel: "mobile_app",
    status: "separated",
    customer_id: 7788,
    customer_name: "Maria Oliveira",
    customer_email: "maria@email.com",
    customer_document: "987.654.321-00",
    seller_id: 55,
    seller_name: "Tech Store",
    seller_city: "São Paulo",
    seller_state: "SP",
  };

  it("monta o payload completo do pedido com total calculado", () => {
    const order = assembleOrder(
      header,
      [makeItemRow()],
      { id_pedido: 1, metodo: "pix", status: "approved", transaction_id: "pay_987654321" },
      { id_pedido: 1, carrier: "Correios", servico: "SEDEX", status: "shipped", tracking_code: "BR123456789" },
      { id_pedido: 1, source: "app", user_agent: "Mozilla/5.0...", ip_address: "10.0.0.1" }
    );

    expect(order.uuid).toBe("ORD-2025-0001");
    expect(order.total).toBe(5000);
    expect(order.items).toHaveLength(1);
    expect(order.seller).toEqual({ id: 55, name: "Tech Store", city: "São Paulo", state: "SP" });
    expect(order.payment?.method).toBe("pix");
    expect(order.shipment?.service).toBe("SEDEX");
  });

  it("retorna seller null quando o pedido nao tem vendedor", () => {
    const order = assembleOrder(
      { ...header, seller_id: null, seller_name: null, seller_city: null, seller_state: null },
      [],
      null,
      null,
      null
    );
    expect(order.seller).toBeNull();
    expect(order.total).toBe(0);
  });
});
