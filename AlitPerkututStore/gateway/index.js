import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import verifyToken from "./authMiddleware.js";

const app = express();
const port = 4098;

app.use((req, res, next) => {
  console.log(`[GATEWAY] ${req.method} ${req.path}`);
  next();
});

// Auth
const authProxy = createProxyMiddleware({
  target: "http://localhost:4198",
  changeOrigin: true,
  pathRewrite: {
    "^/api/auth": "",
  },
  on: {
    proxyReq: (proxyReq, req) => {
      // Only inject if user logged in
      if (req.user) {
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
      }
    },

    error: (err, req, res) => {
      console.error(err);

      res.status(500).json({
        message: "Proxy error",
      });
    },
  },
});

app.use("/api/auth/public", authProxy);

app.use("/api/auth/register-admin", verifyToken, authProxy);

app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found in gateway" });
});

app.listen(port, () => {
  console.log(`API Gateway is running on PORT: ${port}`);
});
