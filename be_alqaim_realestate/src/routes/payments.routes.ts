import express from "express";
import {
  addPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment
} from "../controllers/payments.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/payments/add", authMiddleware, addPayment);
router.get("/payments/all", authMiddleware, getAllPayments);
router.get("/payments/:id", authMiddleware, getPaymentById);
router.put("/payments/:id", authMiddleware, updatePayment);
router.delete("/payments/:id", authMiddleware, deletePayment);

export default router;
