import { Router } from "express";
import { getDashboardSummary, getWeeklyCollection, getRecentPayments } from "../controllers/dashboard.controllers";
const router = Router();

router.get("/dashboard/summary", getDashboardSummary);
router.get("/dashboard/weekly-collection", getWeeklyCollection);
router.get("/dashboard/recent-payments", getRecentPayments);

export default router;