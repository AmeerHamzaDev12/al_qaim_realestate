import { Request, Response } from "express";
import prisma from "../Prisma";
import logger from "../logger";
import { z } from "zod";

const paymentSchema = z.object({
  customerId: z.string().nonempty("Customer is required"),
  method: z.string().nonempty("Payment method is required"),
  paymentStructure: z.string().nonempty("Payment structure is required"),
  date: z.string().nonempty("Date is required"),
  amount: z.string().nonempty("Amount is required"),
  installmentNumber: z.number().optional(),
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
  const {
    customerId,
    method,
    paymentStructure,
    date,
    amount,
    installmentNumber,
  } = parsed.data;
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

    if (
      paymentStructure === "INSTALLMENT" &&
      installmentNumber
    ) {
      if (customer.totalInstallments && installmentNumber > customer.totalInstallments) {
        return res.status(400).json({
          success: false,
          message: `Installment number cannot exceed total installments (${customer.totalInstallments})`,
          data: null,
        });
      }

      const existingInstallment = await prisma.customerPayments.findFirst({
        where: {
          customerId,
          installmentNumber,
        },
      });
      if (existingInstallment) {
        return res.status(400).json({
          success: false,
          message: `Installment #${installmentNumber} already paid for this customer`,
          data: null,
        });
      }
    }

    if (paymentStructure === "CASH") {
      const existingCashPayment = await prisma.customerPayments.findFirst({
        where: {
          customerId,
          paymentStructure: "CASH",
        },
      });
      if (existingCashPayment) {
        return res.status(400).json({
          success: false,
          message: "Cash payment already recorded for this customer",
          data: null,
        });
      }
    }

    const payment = await prisma.customerPayments.create({
      data: {
        customerId,
        method,
        paymentStructure,
        date: new Date(date),
        amount: parseFloat(amount),
        receipt: `RCPT-${Date.now()}`,
        installmentNumber: installmentNumber ?? null,
      },
    });
    logger.info(`Payment added for customer: ${customerId}`);
    return res.status(200).json({
      success: true,
      message: "Payment added successfully",
      data: payment,
    });
  } catch (error) {
    logger.error("Error adding payment:", error);
    return res.status(500).json({
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
    return res.status(200).json({ success: true, data: payments });
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
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    logger.error("Error fetching payment:", error);
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
    const { amount, date, installmentNumber, ...rest } = parsed.data;

    const updateData: any = { ...rest };
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date !== undefined) updateData.date = new Date(date);
    if (installmentNumber !== undefined) updateData.installmentNumber = installmentNumber;

    const payment = await prisma.customerPayments.update({
      where: { id },
      data: updateData,
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
    await prisma.customerPayments.delete({ where: { id } });
    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
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