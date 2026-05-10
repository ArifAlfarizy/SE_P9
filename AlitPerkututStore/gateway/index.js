import express from "express";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import verifyToken from "./authMiddleware.js";

const app = express();
app.use(cookieParser());
const port = 4098;

app.use((req, res, next) => {
  console.log(`[GATEWAY] ${req.method} ${req.path}`);
  next();
});

const injectUser = (proxyReq, req) => {
  console.log(`[PROXY] forwarding to: ${proxyReq.path}`);
  if (req.user) {
    proxyReq.setHeader("x-user-id", req.user.id);
    proxyReq.setHeader("x-user-role", req.user.role);
  }
};

const onError = (err, req, res) => {
  console.error(err);
  res.status(500).json({ message: "Proxy error" });
};

// public — tidak perlu token
app.use(
  createProxyMiddleware({
    pathFilter: "/api/auth/public",
    target: "http://localhost:4198",
    changeOrigin: true,
    on: { proxyReq: injectUser, error: onError },
  }),
);

// admin — wajib token
app.use(
  (req, res, next) => {
    if (req.path.startsWith("/api/auth/admin")) {
      return verifyToken(req, res, next);
    }
    next();
  },
  createProxyMiddleware({
    pathFilter: "/api/auth/admin",
    target: "http://localhost:4198",
    changeOrigin: true,
    on: { proxyReq: injectUser, error: onError },
  }),
);

app.use(
  (req, res, next) => {
    if (req.path.startsWith("/api/list")) {
      return verifyToken(req, res, next);
    }
    next();
  },
  createProxyMiddleware({
    pathFilter: "/api/list",
    target: "http://localhost:4298",
    changeOrigin: true,
    on: { proxyReq: injectUser, error: onError },
  }),
);

app.use(
  (req, res, next) => {
    if (req.path.startsWith("/api/order")) {
      return verifyToken(req, res, next);
    }
    next();
  },
  createProxyMiddleware({
    pathFilter: "/api/order",
    target: "http://localhost:4298",
    changeOrigin: true,
    on: { proxyReq: injectUser, error: onError },
  }),
);

app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found in gateway" });
});

app.listen(port, () => {
  console.log(`API Gateway is running on PORT: ${port}`);
});
