import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "https://rentridenroll.org,https://www.rentridenroll.org")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS."));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  maxAge: 86400,
}));
app.use("/api/public/signature/webhook", express.raw({ type: "*/*", limit: "2mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", async (req, res, next) => {
  if (req.path === "/healthz" || req.path.startsWith("/public/")) {
    next();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const authorization = req.header("authorization");
  if (!supabaseUrl || !publishableKey || adminEmails.length === 0) {
    res.status(503).json({ error: "Administrator authentication is not configured." });
    return;
  }
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Administrator sign-in required." });
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: authorization,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      res.status(401).json({ error: "Administrator session is invalid or expired." });
      return;
    }
    const user = (await response.json()) as { email?: string; email_confirmed_at?: string | null };
    if (!adminEmails.includes(user.email?.trim().toLowerCase() ?? "")) {
      res.status(403).json({ error: "This account is not authorized for administrator access." });
      return;
    }
    if (!user.email_confirmed_at) {
      res.status(403).json({ error: "Confirm the administrator email address before accessing the admin API." });
      return;
    }
    next();
  } catch {
    res.status(503).json({ error: "Unable to verify administrator session." });
  }
});

app.use("/api", router);

export default app;
