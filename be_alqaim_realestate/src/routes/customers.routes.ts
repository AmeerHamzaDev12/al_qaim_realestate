import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/customers/all", getAllCustomers);
router.get("/customers/:id", getCustomerById);
router.post("/customers/add", authMiddleware, createCustomer);
router.put("/customers/:id", authMiddleware, updateCustomer);
router.delete("/customers/:id", authMiddleware, deleteCustomer);

export default router;