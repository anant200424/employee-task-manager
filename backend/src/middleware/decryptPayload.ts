import { Request, Response, NextFunction } from "express";
import { decryptPayload } from "../utils/crypto";

/**
 * Middleware that automatically decrypts incoming AES-encrypted request payloads.
 * If the client transmits { data: "enc:<iv>:<cipher>" }, this unpacks and parses
 * the encrypted JSON payload directly into req.body before validators and route handlers run.
 */
export const decryptPayloadMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.body && typeof req.body === "object" && typeof req.body.data === "string") {
    req.body = decryptPayload(req.body);
  }
  next();
};
