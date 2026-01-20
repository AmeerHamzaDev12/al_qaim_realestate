import { Request, Response } from "express";
import prisma from "../Prisma";
import logger from "../logger";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().nonempty("Name is required"),
  cnic: z.string().nonempty("CNIC is required"),
  phone: z.string().nonempty("Phone is required"),
  address: z.string().nonempty("Address is required"),
  plot: z.string().nonempty("Plot is required"),
  plotSize: z.string().nonempty("Plot Size is required"),
  plotType: z.string().nonempty("Plot Type is required"),
  phase: z.string().nonempty("Phase is required"),
  bookingDate: z.string().nonempty("Booking Date is required"),
  totalPrice: z.string().nonempty("Total Price is required"),
});

const updateCustomerSchema = customerSchema.partial();

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    logger.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: String(id) },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    logger.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn("Invalid customer data");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: parsed.error.flatten().fieldErrors,
    });
  }

  const {
    name,
    cnic,
    phone,
    address,
    plot,
    plotSize,
    plotType,
    phase,
    bookingDate,
    totalPrice,
  } = parsed.data;

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { cnic },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this CNIC already exists",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        cnic,
        phone,
        address,
        plot,
        plotSize,
        plotType,
        phase,
        bookingDate: new Date(bookingDate),
        totalPrice: parseFloat(totalPrice),
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: customer,
    });
  } catch (error) {
    logger.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn("Invalid customer data");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { id } = req.params;
    const {
      name,
      cnic,
      phone,
      address,
      plot,
      plotSize,
      plotType,
      phase,
      bookingDate,
      totalPrice,
    } = parsed.data;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: String(id) },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (cnic && cnic !== existingCustomer.cnic) {
      const cnicExists = await prisma.customer.findUnique({
        where: { cnic },
      });

      if (cnicExists) {
        return res.status(400).json({
          success: false,
          message: "Customer with this CNIC already exists",
        });
      }
    }

    const customer = await prisma.customer.update({
      where: { id: String(id) },
      data: {
        ...(name && { name }),
        ...(cnic && { cnic }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(plot && { plot }),
        ...(plotSize && { plotSize }),
        ...(plotType && { plotType }),
        ...(phase && { phase }),
        ...(bookingDate && { bookingDate: new Date(bookingDate) }),
        ...(totalPrice && { totalPrice: parseFloat(totalPrice) }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    logger.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: String(id) },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await prisma.customer.delete({
      where: { id: String(id) },
    });

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};