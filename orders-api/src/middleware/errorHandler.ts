import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Erro nao tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
}
