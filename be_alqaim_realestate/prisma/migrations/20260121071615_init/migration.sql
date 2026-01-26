-- CreateTable
CREATE TABLE "customerPayments" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "receipt" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "customerPayments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customerPayments" ADD CONSTRAINT "customerPayments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
