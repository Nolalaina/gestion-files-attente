require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const http       = require("http");
const { Server } = require("socket.io");
const db         = require("./config/db");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || "*", methods: ["GET","POST"] },
  pingTimeout: 60000,
});
app.set("io", io);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { error: "Trop de requetes, reessayez plus tard." },
}));
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== "test")
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/bank",     require("./routes/bankingRoutes"));
app.use("/api/tickets",  require("./routes/ticketRoutes"));
app.use("/api/queues",   require("./routes/queueRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/stats",    require("./routes/statsRoutes"));
app.use("/api/users",    require("./routes/userRoutes"));

app.get("/api/health", async (_req, res) => {
  try { await db.query("SELECT 1"); res.json({ status: "OK", db: "connected", ts: new Date() }); }
  catch { res.status(503).json({ status: "ERROR", db: "disconnected" }); }
});

app.use((_req, res) => res.status(404).json({ error: "Route introuvable" }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Erreur serveur" : err.message,
  });
});

io.on("connection", (socket) => {
  socket.on("join_queue",  (id) => socket.join(`queue_${id}`));
  socket.on("leave_queue", (id) => socket.leave(`queue_${id}`));
  socket.on("join_admin",  ()   => socket.join("admin"));
  socket.on("disconnect",  ()   => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`\n✅  Serveur: http://localhost:${PORT}\n`));
