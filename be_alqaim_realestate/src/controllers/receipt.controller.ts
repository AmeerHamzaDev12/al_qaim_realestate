import { Request, Response } from "express";
import prisma from "../Prisma";
import logger from "../logger";
import { z } from "zod";
import PDFDocument from "pdfkit"

const paymentSchema = z.object({
  customerId: z.string().nonempty("Customer is required"),
  method: z.string().nonempty("Payment method is required"),
  date: z.string().nonempty("Date is required"),
  amount: z.string().nonempty("Amount is required"),
});


export const downloadReceipt = async (req: Request, res: Response) => {
  let { id } = req.params;
  if (Array.isArray(id)) id = id[0];

  const payment = await prisma.customerPayments.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!payment) return res.status(404).json({ error: "Payment not found" });

   const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=receipt-${payment.receipt}.pdf`
  );

  doc.pipe(res);

  // --- HEADER SECTION ---
  // Company Name with elegant styling
  doc
    .fontSize(24)
    .fillColor("#1a1a1a")
    .font("Helvetica-Bold")
    .text("AL-QAIM ASSOCIATES & DEVELOPERS", 50, 50, {
      align: "center",
    });

  doc
    .fontSize(10)
    .fillColor("#666666")
    .font("Helvetica")
    .text("Office No. 313, Block-A, 3rd Floor, Dar Plaza, Gilgit", {
      align: "center",
    });

  doc
    .fontSize(9)
    .text("Phone: 0315-5265707 | Email: info@alqaim.com", {
      align: "center",
    });

  // Decorative line
  doc
    .moveTo(50, 110)
    .lineTo(doc.page.width - 50, 110)
    .strokeColor("#c9302c")
    .lineWidth(2)
    .stroke();

  doc.moveDown(2);

  // --- RECEIPT TITLE ---
  const receiptTitleY = 135;
  doc
    .fontSize(18)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("PAYMENT RECEIPT", 50, receiptTitleY, {
      align: "center",
    });

  doc.moveDown(2);

  // --- RECEIPT INFO BOX ---
  const infoBoxY = 175;
  doc
    .rect(50, infoBoxY, doc.page.width - 100, 35)
    .fillAndStroke("#f5f5f5", "#dddddd");

  doc
    .fontSize(10)
    .fillColor("#333333")
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
      infoBoxY + 10
    );

  doc.moveDown(3);

  // --- CUSTOMER DETAILS SECTION ---
  const customerSectionY = 230;
  doc
    .fontSize(12)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("CUSTOMER INFORMATION", 50, customerSectionY);

  // Customer details box
  doc
    .roundedRect(50, customerSectionY + 25, doc.page.width - 100, 80, 5)
    .fillAndStroke("#ffffff", "#dddddd");

  const detailsY = customerSectionY + 35;
  const leftCol = 65;
  const rightCol = 320;

  doc
    .fontSize(10)
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Customer Name:", leftCol, detailsY)
    .fillColor("#333333")
    .font("Helvetica")
    .text(payment.customer.name, leftCol + 100, detailsY);

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("CNIC:", leftCol, detailsY + 20)
    .fillColor("#333333")
    .font("Helvetica")
    .text(payment.customer.cnic, leftCol + 100, detailsY + 20);

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Phone:", leftCol, detailsY + 40)
    .fillColor("#333333")
    .font("Helvetica")
    .text(payment.customer.phone, leftCol + 100, detailsY + 40);

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Address:", leftCol, detailsY + 60)
    .fillColor("#333333")
    .font("Helvetica")
    .text(payment.customer.address ?? "", leftCol + 100, detailsY + 60, {
      width: 380,
    });

  doc.moveDown(4);

  // --- PROPERTY DETAILS SECTION ---
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
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Project Name:", leftCol, propDetailsY)
    .fillColor("#333333")
    .font("Helvetica")
    .text("AL-Madina City", leftCol + 100, propDetailsY);

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Plot No:", leftCol, propDetailsY + 20)
    .fillColor("#333333")
    .font("Helvetica")
    .text(payment.customer.plot, leftCol + 100, propDetailsY + 20);

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Block/Phase:", rightCol, propDetailsY + 20)
    .fillColor("#333333")
    .font("Helvetica")
    .text(payment.customer.phase, rightCol + 80, propDetailsY + 20);

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Plot Type:", leftCol, propDetailsY + 40)
    .fillColor("#333333")
    .font("Helvetica")
    .text(
      payment.customer.plotType || "N/A",
      leftCol + 100,
      propDetailsY + 40
    );

  doc
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Plot Size:", rightCol, propDetailsY + 40)
    .fillColor("#333333")
    .font("Helvetica")
    .text(
      payment.customer.plotSize || "N/A",
      rightCol + 80,
      propDetailsY + 40
    );

  doc.moveDown(4);

  // --- PAYMENT DETAILS SECTION ---
  const paymentSectionY = 460;
  doc
    .fontSize(12)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text("PAYMENT DETAILS", 50, paymentSectionY);

  // Amount box with highlight
  doc
    .roundedRect(50, paymentSectionY + 25, doc.page.width - 100, 50, 5)
    .fillAndStroke("#f9f9f9", "#c9302c");

  doc
    .fontSize(11)
    .fillColor("#666666")
    .font("Helvetica-Bold")
    .text("Amount Paid:", 65, paymentSectionY + 38);

  doc
    .fontSize(20)
    .fillColor("#c9302c")
    .font("Helvetica-Bold")
    .text(
      `PKR ${payment.amount.toLocaleString()}`,
      doc.page.width - 250,
      paymentSectionY + 35
    );

  doc
    .fontSize(10)
    .fillColor("#666666")
    .font("Helvetica-Oblique")
    .text("Rupees " + numberToWords(payment.amount) + " Only", 65, paymentSectionY + 58, {
      width: doc.page.width - 130,
    });

  // --- SIGNATURE SECTION ---
  const signatureY = doc.page.height - 150;
  
  doc
    .moveTo(50, signatureY - 20)
    .lineTo(doc.page.width - 50, signatureY - 20)
    .strokeColor("#eeeeee")
    .lineWidth(1)
    .stroke();

  doc
    .fontSize(10)
    .fillColor("#666666")
    .font("Helvetica-Oblique")
    .text(
      "This is a computer-generated receipt and does not require a signature.",
      50,
      signatureY,
      {
        align: "left",
        width: 300,
      }
    );

  doc
    .fontSize(10)
    .fillColor("#333333")
    .font("Helvetica-Bold")
    .text("Authorized Signature", doc.page.width - 200, signatureY + 20, {
      align: "left",
    });

  // Signature line
  doc
    .moveTo(doc.page.width - 200, signatureY + 50)
    .lineTo(doc.page.width - 50, signatureY + 50)
    .strokeColor("#333333")
    .lineWidth(1)
    .stroke();

  // --- FOOTER ---
  doc
    .fontSize(8)
    .fillColor("#999999")
    .font("Helvetica")
    .text(
      "Thank you for your payment! For any queries, please contact us at 0315-5265707",
      50,
      doc.page.height - 50,
      {
        align: "center",
      }
    );

  doc
    .fontSize(7)
    .fillColor("#cccccc")
    .text(
      "AL-QAIM ASSOCIATES & DEVELOPERS | Gilgit | www.alqaim.com",
      50,
      doc.page.height - 35,
      {
        align: "center",
      }
    );

  doc.end();
};

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  function convertHundreds(n: number): string {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
  }

  if (num < 1000) return convertHundreds(num);
  if (num < 100000) {
    return convertHundreds(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertHundreds(num % 1000) : '');
  }
  
  const lakhs = Math.floor(num / 100000);
  const remainder = num % 100000;
  return convertHundreds(lakhs) + ' Lakh' + (remainder !== 0 ? ' ' + convertHundreds(Math.floor(remainder / 1000)) + (remainder % 1000 !== 0 ? ' Thousand ' + convertHundreds(remainder % 1000) : '') : '');
}