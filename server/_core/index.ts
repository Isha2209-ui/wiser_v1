import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { invokeLLMStream } from "./llm";
import { answerDeterministically, financialSnapshot } from "../financeData";
import { sdk } from "./sdk";

const advisorSystem = `You are CredWise Intelligence, a careful personal finance advisor. Use only the supplied financial profile. Never invent balances, returns, transactions, rates, or facts. Distinguish retrieved data, calculated values, assumptions, projections, recommendations, and missing data. Give a concise answer first, then rationale and one next action. Use Indian rupee formatting. This is educational financial intelligence, not a guarantee or regulated personal recommendation.`;

function writeSse(res: express.Response, event: string, payload: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/finance/ask/stream", async (req, res) => {
    try {
      await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    if (!question || question.length > 1200) {
      res.status(400).json({ error: "A valid question is required" });
      return;
    }
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
    res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    let closed = false;
    res.on("close", () => { closed = true; controller.abort(); });
    try {
      writeSse(res, "meta", { source: "CredWise Intelligence" });
      const upstream = await invokeLLMStream({
        model: "gpt-5-mini",
        reasoning: { effort: "low" },
        messages: [
          { role: "system", content: advisorSystem },
          { role: "system", content: `Retrieved financial profile and deterministic metrics:\n${JSON.stringify(financialSnapshot())}` },
          ...history.filter((item: any) => item?.role === "user" || item?.role === "assistant").map((item: any) => ({ role: item.role, content: String(item.content).slice(0, 4000) })),
          { role: "user", content: question },
        ],
      }, controller.signal);
      if (!upstream.ok || !upstream.body) throw new Error(`LLM stream failed: ${upstream.status}`);
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let emitted = false;
      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find(line => line.startsWith("data: "));
          if (!dataLine) continue;
          const raw = dataLine.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) { emitted = true; writeSse(res, "chunk", { delta }); }
          } catch { /* Ignore incomplete provider frames. */ }
        }
      }
      if (!closed) {
        if (!emitted) writeSse(res, "fallback", { answer: answerDeterministically(question), source: "Deterministic profile analysis" });
        writeSse(res, "done", { source: emitted ? "CredWise Intelligence" : "Deterministic profile analysis" });
      }
    } catch (error) {
      if (!closed) {
        console.warn("[CredWise] Streaming advisor unavailable, using deterministic fallback", error);
        writeSse(res, "fallback", { answer: answerDeterministically(question), source: "Deterministic profile analysis" });
        writeSse(res, "done", { source: "Deterministic profile analysis" });
      }
    } finally {
      clearTimeout(timeout);
      if (!closed) res.end();
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
