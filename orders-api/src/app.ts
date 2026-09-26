import cors from "cors";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import express, { Express } from "express";
import { Pool } from "pg";
import { createOrdersRouter } from "./routes/orders.routes";
import { PostgresOrderRepository } from "./repositories/postgresOrderRepository";
import { OrderService } from "./services/orderService";
import { FinancialSummaryService } from "./services/financialSummaryService";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(pool: Pool): Express {
  const app = express();
  // API somente leitura, publica no sentido de nao ter dados sensiveis por
  // tras de auth hoje: libera CORS para qualquer origem para permitir o
  // frontend de dev (orders-web) e ferramentas como o API Playground.
  app.use(cors());
  app.use(express.json());

  const repository = new PostgresOrderRepository(pool);
  const orderService = new OrderService(repository);
  const financialSummaryService = new FinancialSummaryService(repository);

  // Documentacao OpenAPI (docs/swagger.yaml na raiz do repositorio).
  const swaggerPath = path.resolve(__dirname, "../../docs/swagger.yaml");
  const swaggerDoc = YAML.parse(fs.readFileSync(swaggerPath, "utf8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/orders", createOrdersRouter(orderService, financialSummaryService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
