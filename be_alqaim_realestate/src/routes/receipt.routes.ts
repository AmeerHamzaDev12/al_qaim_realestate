import express from "express";
import { downloadReceipt } from "../controllers/receipt.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();
router.get("/payments/receipt/:id", authMiddleware, downloadReceipt);

export default router;