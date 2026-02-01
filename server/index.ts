import express from "express";
import { createServer } from "http";
import { authRoutes } from "@/routes/auth-routes";
import { contestRoutes } from "@/routes/contest-routes";
import { PORT } from "@/config";
import { problemRoutes } from "@/routes/problem-routes";
import { setupSocketIO } from "@/ws";
import cors from "cors";
import { userProfileUpdateRoutes } from "@/routes/user-route";
import {
  authRateLimiter,
  globalLimiter,
} from "@/middleware/rate-limit-middleware";
import { authMiddleware } from "@/middleware/auth-middleware";

const app = express();
const httpServer = createServer(app);

setupSocketIO(httpServer);
app.use(express.json());
app.use(globalLimiter);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/contests", authMiddleware, contestRoutes);
app.use("/api/problems", authMiddleware, problemRoutes);
app.use("/api/user/profile/update", authMiddleware, userProfileUpdateRoutes);

httpServer.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
