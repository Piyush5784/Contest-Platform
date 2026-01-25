import express from "express";
import { createServer } from "http";
import { authRoutes } from "@/routes/auth-routes";
import { contestRoutes } from "./routes/contest-routes";
import { PORT } from "./config";
import { authMiddleware } from "./lib/auth-middleware";
import { problemRoutes } from "./routes/problem-routes";
import { setupSocketIO } from "./ws";

const app = express();
const httpServer = createServer(app);

setupSocketIO(httpServer);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/contests", authMiddleware, contestRoutes);
app.use("/api/problems", authMiddleware, problemRoutes);

httpServer.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
