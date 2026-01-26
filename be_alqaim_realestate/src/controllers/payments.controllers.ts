import { Request, Response } from "express";
import prisma from "../Prisma";
import logger from "../logger";
import { z } from "zod";
import PDFDocument from "pdfkit"
import { Prisma } from "../generated/prisma/browser";

const paymentSchema = z.object({
  customerId: z.string().nonempty("Customer is required"),
  method: z.string().nonempty("Payment method is required"),
  date: z.string().nonempty("Date is required"),
  amount: z.string().nonempty("Amount is required"),
});

export const addPayment = async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
    logger.warn("Invalid payment data");
    return res.status(400).json({
      success: false,
        message: "Validation failed",
        data: parsed.error.flatten().fieldErrors,
    });
  }
    const { customerId, method, date, amount } = parsed.data;
    try {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
    });
    if (!customer) {
      logger.info(`Customer not found: ${customerId}`);
        return res
        .status(404)
        .json({ success: false, message: "Customer not found", data: null });
    }
    const payment = await prisma.customerPayments.create({
        data: {
        customerId,
        method,
        date: new Date(date),
        amount: parseFloat(amount),
        receipt: `RCPT-${Date.now()}`,
        },
    }); 
    logger.info(`Payment added for customer: ${customerId}`);
    return res
      .status(200)
        .json({
        success: true,
        message: "Payment added successfully",
        data: payment,
      });
  } catch (error) {
    logger.error("Error adding payment:", error);
    return res
        .status(500)
        .json({
        success: false,
        message: "Failed to add payment",
        data: { error: (error as Error).message },
      });
  }
};

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.customerPayments.findMany({
      include: { customer: true },
      orderBy: { date: "desc" },
    });
    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    logger.error("Error fetching payments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      data: { error: (error as Error).message },
    });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  let { id } = req.params;
  if (Array.isArray(id)) {
    id = id[0];
  }
  try {
    const payment = await prisma.customerPayments.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Payment fetched successfully",
      data: payment,
    });
  } catch (error) {
    logger.error("Error fetching payment by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      data: { error: (error as Error).message },
    });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  let { id } = req.params;
  const parsed = paymentSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    logger.warn("Invalid payment update data");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: parsed.error.flatten().fieldErrors,
    });
  }
  if (Array.isArray(id)) {
    id = id[0];
  }
  try {
    const payment = await prisma.customerPayments.update({
      where: { id },
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
        amount: parsed.data.amount ? parseFloat(parsed.data.amount) : undefined,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    logger.error("Error updating payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment",
      data: { error: (error as Error).message },
    });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  let { id } = req.params;
  if (Array.isArray(id)) {
    id = id[0];
  }
  try {
    await prisma.customerPayments.delete({
      where: { id },
    });
    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
      data: null,
    });
  } catch (error) {
    logger.error("Error deleting payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      data: { error: (error as Error).message },
    });
  }
};