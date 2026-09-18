import jwt, { SignOptions } from "jsonwebtoken";
import { Response } from "express";

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ||
      "15m") as SignOptions["expiresIn"],
  });
};

// rememberMe = true  → 30 din ka token (persistent session)
// rememberMe = false → 7 din ka token (default, standard session)
export const generateRefreshToken = (
  payload: TokenPayload,
  rememberMe = false,
): string => {
  const expiry = rememberMe
    ? (process.env.JWT_REFRESH_REMEMBER_EXPIRES_IN || "30d")
    : (process.env.JWT_REFRESH_EXPIRES_IN || "7d");
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: expiry as SignOptions["expiresIn"],
  });
};

// Sets the access token as a secure, httpOnly cookie to prevent XSS token theft
export const setAccessTokenCookie = (res: Response, token: string): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

export const clearAccessTokenCookie = (res: Response): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  });
  res.clearCookie("accessToken");
};

// Sets the refresh token as a secure, httpOnly cookie so it can never be
// read or exfiltrated via client-side JavaScript (mitigates XSS token theft).
// rememberMe = true  → Persistent cookie: 30 din (browser band hone ke baad bhi rahe)
// rememberMe = false → Standard cookie: 7 din
export const setRefreshTokenCookie = (
  res: Response,
  token: string,
  rememberMe = false,
): void => {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 din (Remember Me ON)
    : 7 * 24 * 60 * 60 * 1000; // 7 din (Remember Me OFF)
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/auth",
    maxAge,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/auth",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
  });
  res.clearCookie("refreshToken");
};

