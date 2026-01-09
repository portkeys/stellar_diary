// api/_handler.ts
import express from "express";
import serverless from "serverless-http";
var app = express();
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), bundled: true });
});
app.get("/api/test", (_req, res) => {
  res.json({ test: "bundled express works" });
});
var handler = serverless(app);
async function handler_default(req, res) {
  return handler(req, res);
}
export {
  handler_default as default
};
