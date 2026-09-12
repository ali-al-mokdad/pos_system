-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "maxDiscountPercent" REAL NOT NULL DEFAULT 10,
    "canSeeCost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "barcode" TEXT NOT NULL,
    "qrCode" TEXT,
    "sku" TEXT,
    "categoryId" INTEGER,
    "sellingPrice" REAL NOT NULL DEFAULT 0,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "stockQuantity" REAL NOT NULL DEFAULT 0,
    "minimumStock" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'PIECE',
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "shiftId" INTEGER,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amountReceived" REAL NOT NULL DEFAULT 0,
    "changeAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "barcode" TEXT,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "refundedQty" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Refund_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "previousStock" REAL NOT NULL,
    "newStock" REAL NOT NULL,
    "reason" TEXT,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "openingCash" REAL NOT NULL DEFAULT 0,
    "closingCash" REAL,
    "expectedCash" REAL,
    "difference" REAL,
    "note" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeldSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "label" TEXT,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "caption" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Counter" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "businessName" TEXT NOT NULL DEFAULT 'Market POS',
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "currency" TEXT NOT NULL DEFAULT '$',
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "receiptFooter" TEXT NOT NULL DEFAULT 'Thank you!',
    "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
    "printerType" TEXT NOT NULL DEFAULT 'NETWORK',
    "printerName" TEXT,
    "printerIp" TEXT,
    "printerPort" INTEGER NOT NULL DEFAULT 9100,
    "paperWidth" INTEGER NOT NULL DEFAULT 80,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_qrCode_key" ON "Product"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_receiptNumber_key" ON "Sale"("receiptNumber");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
