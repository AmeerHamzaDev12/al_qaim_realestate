import { Request, Response } from "express";
import prisma from "../Prisma";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const totalCustomers = await prisma.customer.count();
    const plotsSold = await prisma.customer.count(); // Or use a different logic if needed
    const collectedAmount = await prisma.customerPayments.aggregate({
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // This month
        },
      },
    });
    const outstandingBalance = await prisma.customer.aggregate({
      _sum: { totalPrice: true },
    });
    const totalPayments = await prisma.customerPayments.aggregate({
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        plotsSold,
        collectedAmount: collectedAmount._sum.amount || 0,
        outstandingBalance: outstandingBalance._sum.totalPrice || 0,
        totalPayments: totalPayments._sum.amount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
};

export const getWeeklyCollection = async (req: Request, res: Response) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const payments = await prisma.customerPayments.findMany({
      where: {
        date: { gte: startOfWeek }
      },
      orderBy: { date: "asc" }
    });

    const summary: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const key = day.toLocaleDateString("en-US", { weekday: "short" });
      summary[key] = 0;
    }
    payments.forEach((p: { date: string | number | Date; amount: number; }) => {
      const key = new Date(p.date).toLocaleDateString("en-US", { weekday: "short" });
      summary[key] += p.amount;
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch weekly summary" });
  }
};

export const getRecentPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.customerPayments.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { customer: true }
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch recent payments" });
  }
};