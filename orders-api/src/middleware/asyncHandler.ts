import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envolve um handler async para encaminhar rejeicoes de Promise ao
 * error handler do Express (evita repetir try/catch em cada rota).
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
