import { Request, Response } from "express";
import prisma from "../Prisma";
import PDFDocument from "pdfkit";

export const downloadReceipt = async (req: Request, res: Response) => {
  let { id } = req.params;
  if (Array.isArray(id)) id = id[0];

  const payment = await prisma.customerPayments.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!payment) return res.status(404).json({ error: "Payment not found" });

  // ================= CALCULATIONS =================
  const paidInstallmentsCount = await prisma.customerPayments.count({
    where: {
      customerId: payment.customerId,
      paymentStructure: "INSTALLMENT",
      installmentNumber: { not: null },
    },
  });

  const paidAmountResult = await prisma.customerPayments.aggregate({
    where: { customerId: payment.customerId },
    _sum: { amount: true },
  });

  const totalPaidAmount = paidAmountResult._sum.amount || 0;
  const totalInstallments = payment.customer.totalInstallments || 0;
  const remainingInstallments = Math.max(
    0,
    totalInstallments - paidInstallmentsCount,
  );
  const remainingAmount = Math.max(
    0,
    payment.customer.totalPrice - totalPaidAmount,
  );

  // Payment label
  let paymentTypeText = "-";
  if (payment.paymentStructure === "INSTALLMENT") {
    if (payment.installmentNumber) {
      paymentTypeText = `Installment ${payment.installmentNumber}`;
    } else {
      paymentTypeText = "Installment";
    }
  } else if (payment.paymentStructure === "CASH") {
    paymentTypeText = "Cash One Time";
  }

  // ================= PDF INIT =================
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${payment.receipt}.pdf`,
  );

  doc.pipe(res);

  // ================= HEADER =================
  doc
    .fontSize(24)
    .fillColor("#1a1a1a")
    .font("Helvetica-Bold")
    .text("AL-QAIM ASSOCIATES & DEVELOPERS", 50, 50, { align: "center" });

  doc
    .fontSize(10)
    .fillColor("#666")
    .font("Helvetica")
    .text("Office No. 313, Block-A, 3rd Floor, Dar Plaza, Gilgit", {
      align: "center",
    });

  doc.fontSize(9).text("Phone: 0315-5265707 | Email: info@alqaim.com", {
    align: "center",
  });

  doc
    .moveTo(50, 110)
    .lineTo(doc.page.width - 50, 110)
    .strokeColor("#c9302c")
    .lineWidth(2)
    .stroke();

  // ================= TITLE =================
  doc
    .fontSize(18)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("PAYMENT RECEIPT", 50, 135, { align: "center" });

  // ================= RECEIPT BOX =================
  const infoBoxY = 175;

  doc
    .rect(50, infoBoxY, doc.page.width - 100, 35)
    .fillAndStroke("#f5f5f5", "#dddddd");

  doc
    .fontSize(10)
    .fillColor("#333")
    .font("Helvetica-Bold")
    .text("Receipt No:", 60, infoBoxY + 10)
    .font("Helvetica")
    .text(payment.receipt, 140, infoBoxY + 10);

  doc
    .font("Helvetica-Bold")
    .text("Date:", doc.page.width - 200, infoBoxY + 10)
    .font("Helvetica")
    .text(
      payment.date.toISOString().split("T")[0],
      doc.page.width - 150,
      infoBoxY + 10,
    );

  // ================= CUSTOMER =================
  const customerSectionY = 230;

  doc
    .fontSize(12)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("CUSTOMER INFORMATION", 50, customerSectionY);

  doc
    .roundedRect(50, customerSectionY + 25, doc.page.width - 100, 80, 5)
    .fillAndStroke("#ffffff", "#dddddd");

  const leftCol = 65;
  const rightCol = 320;
  const detailsY = customerSectionY + 35;

  doc
    .fontSize(10)
    .fillColor("#666")
    .font("Helvetica-Bold")
    .text("Customer Name:", leftCol, detailsY)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.name, leftCol + 100, detailsY);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("CNIC:", leftCol, detailsY + 20)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.cnic, leftCol + 100, detailsY + 20);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Phone:", leftCol, detailsY + 40)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.phone, leftCol + 100, detailsY + 40);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Address:", leftCol, detailsY + 60)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.address ?? "", leftCol + 100, detailsY + 60, {
      width: 380,
    });

  // ================= PROPERTY =================
  const propertySectionY = 350;

  doc
    .fontSize(12)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("PROPERTY DETAILS", 50, propertySectionY);

  doc
    .roundedRect(50, propertySectionY + 25, doc.page.width - 100, 60, 5)
    .fillAndStroke("#ffffff", "#dddddd");

  const propDetailsY = propertySectionY + 35;

  doc
    .fontSize(10)
    .fillColor("#666")
    .font("Helvetica-Bold")
    .text("Project Name:", leftCol, propDetailsY)
    .font("Helvetica")
    .fillColor("#333")
    .text("AL-Madina City", leftCol + 100, propDetailsY);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Plot No:", leftCol, propDetailsY + 20)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.plot, leftCol + 100, propDetailsY + 20);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Block/Phase:", rightCol, propDetailsY + 20)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.phase, rightCol + 80, propDetailsY + 20);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Plot Type:", leftCol, propDetailsY + 40)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.plotType || "N/A", leftCol + 100, propDetailsY + 40);

  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Plot Size:", rightCol, propDetailsY + 40)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.customer.plotSize || "N/A", rightCol + 80, propDetailsY + 40);

  // ================= PAYMENT DETAILS =================
  const paymentSectionY = 460;
  const isInstallment = payment.paymentStructure === "INSTALLMENT";
  const paymentBoxHeight = isInstallment ? 190 : 140;

  doc
    .fontSize(12)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("PAYMENT DETAILS", 50, paymentSectionY);

  doc
    .roundedRect(
      50,
      paymentSectionY + 25,
      doc.page.width - 100,
      paymentBoxHeight,
      5,
    )
    .fillAndStroke("#f9f9f9", "#c9302c");

  let lineY = paymentSectionY + 40;

  // Payment Info
  doc
    .fontSize(11)
    .fillColor("#666")
    .font("Helvetica-Bold")
    .text("Payment Info:", 65, lineY)
    .font("Helvetica")
    .fillColor("#333")
    .text(paymentTypeText, 180, lineY);

  // Payment Method
  lineY += 20;
  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Payment Method:", 65, lineY)
    .font("Helvetica")
    .fillColor("#333")
    .text(payment.method || "N/A", 180, lineY);

  // Total Price
  lineY += 20;
  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Total Price:", 65, lineY)
    .font("Helvetica")
    .fillColor("#333")
    .text(`PKR ${payment.customer.totalPrice.toLocaleString()}`, 180, lineY);

  // Total Paid
  lineY += 20;
  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Total Paid Amount:", 65, lineY)
    .font("Helvetica-Bold")
    .fillColor("#1a8754")
    .text(`PKR ${totalPaidAmount.toLocaleString()}`, 180, lineY);

  // Remaining
  lineY += 20;
  doc
    .font("Helvetica-Bold")
    .fillColor("#666")
    .text("Remaining Amount:", 65, lineY)
    .font("Helvetica-Bold")
    .fillColor("#c9302c")
    .text(`PKR ${remainingAmount.toLocaleString()}`, 180, lineY);

  // ===== INSTALLMENT INFO (CLEAN) =====
  if (isInstallment) {
    lineY += 25;

    doc
      .moveTo(65, lineY - 5)
      .lineTo(doc.page.width - 65, lineY - 5)
      .strokeColor("#e0e0e0")
      .lineWidth(0.5)
      .stroke();

    lineY += 5;

    doc
      .fontSize(10)
      .fillColor("#666")
      .font("Helvetica-Bold")
      .text("Total Installments:", 65, lineY)
      .font("Helvetica")
      .fillColor("#333")
      .text(String(totalInstallments), 180, lineY);

    doc
      .font("Helvetica-Bold")
      .fillColor("#666")
      .text("Paid Installments:", rightCol, lineY)
      .font("Helvetica-Bold")
      .fillColor("#1a8754")
      .text(String(paidInstallmentsCount), rightCol + 110, lineY);

    lineY += 18;

    doc
      .font("Helvetica-Bold")
      .fillColor("#666")
      .text("Remaining:", 65, lineY)
      .font("Helvetica-Bold")
      .fillColor("#c9302c")
      .text(String(remainingInstallments), 180, lineY);

    lineY += 25;
  }

  // ================= AMOUNT PAID =================
  doc
    .moveTo(65, lineY - 5)
    .lineTo(doc.page.width - 65, lineY - 5)
    .strokeColor("#e0e0e0")
    .lineWidth(0.5)
    .stroke();

  lineY += 10;

  doc
    .fontSize(11)
    .fillColor("#666")
    .font("Helvetica-Bold")
    .text("Amount Paid:", 65, lineY);

  doc
    .fontSize(20)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text(`PKR ${payment.amount.toLocaleString()}`, 65, lineY, {
      align: "right",
      width: doc.page.width - 130,
    });

  const footerBaseY = doc.page.height - 90;

// ===== Computer generated note (TOP — centered) =====
doc
  .fontSize(9)
  .fillColor("#666")
  .font("Helvetica-Oblique")
  .text(
    "This is a computer generated receipt",
    50,
    footerBaseY - 25,
    {
      align: "center",
      width: doc.page.width - 100,
    }
  );

// ===== Receipt label (center) =====
doc
  .fontSize(10)
  .fillColor("#666")
  .font("Helvetica-Bold")
  .text(
    "AL-Qaim Real Estate Receipt",
    50,
    footerBaseY - 8,
    {
      align: "center",
      width: doc.page.width - 100,
    }
  );

// ===== Signature line (RIGHT SIDE) =====
const signY = footerBaseY + 10;

doc
  .moveTo(doc.page.width - 220, signY)
  .lineTo(doc.page.width - 70, signY)
  .strokeColor("#333")
  .lineWidth(1)
  .stroke();

// Signature label
doc
  .fontSize(10)
  .fillColor("#333")
  .font("Helvetica-Bold")
  .text(
    "Authorized Signature",
    doc.page.width - 220,
    signY + 5,
    {
      width: 150,
      align: "center",
    }
  );

doc.end();
}