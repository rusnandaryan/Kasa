export type BusinessType = 'fnb' | 'retail' | 'service' | 'custom' | string;

export interface CustomBusinessType {
  id: string;
  name: string;
  desc?: string;
  itemLabel: string;
  categoryLabel: string;
  orderIdentifier: string;
  defaultUnit?: string;
  themeColor?: string;
}

export type UserRole = 'owner' | 'admin' | 'cashier';

export type OrderServiceType = 'dine_in' | 'take_away';

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'ewallet' | 'debt';

export type PaymentStatus = 'paid' | 'pending' | 'voided' | 'debt';

export type CashflowType = 'income' | 'expense';

export type FundSource = 'cash_drawer' | 'bank_owner';

export interface StoreBranding {
  id: string;
  brandName: string;
  tagline: string;
  logoUrl: string; // Defaults to '/logo.jpg'
  themeColor: string; // Hex, e.g. '#2563EB'
  businessType: BusinessType;
  customBusinessTypes?: CustomBusinessType[];
  address: string;
  phoneWhatsapp: string;
  currency: string;
  taxPercentage: number;
  serviceChargePct: number;
  customTerminology: {
    itemLabel: string; // e.g. "Menu", "Produk", "Layanan"
    categoryLabel: string;
    orderIdentifier: string; // e.g. "Nomor Meja", "Plat Kendaraan", "Nama Pelanggan"
  };
  receiptConfig: {
    headerText: string;
    footerText: string;
    showLogo: boolean;
    paperSize: '58mm' | '80mm';
    showStoreAddress: boolean;
    showWhatsapp: boolean;
  };
}

export interface StoreMember {
  id: string;
  storeId: string;
  fullName: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  pinCode: string; // 6-digit PIN
  isActive: boolean;
  permissions: {
    canDiscount: boolean;
    canOpenPrice: boolean;
    canViewDailyRevenue: boolean;
    canVoidOrder: boolean;
    canManageCatalog: boolean;
    canManageExpenses: boolean;
  };
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  colorBadge: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductVariantOption {
  name: string;
  priceDelta: number; // e.g. +5000
}

export interface ProductVariantGroup {
  groupName: string; // e.g. "Ukuran", "Level Pedas", "Topping"
  required: boolean;
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  skuBarcode?: string;
  imageUrl?: string;
  sellingPrice: number; // In full Rupiah
  costPrice: number; // HPP (Harga Pokok Penjualan)
  unitName: string; // Pcs, Porsi, Kg, Jam, Paket
  allowDecimalQty: boolean;
  isOpenPrice: boolean;
  trackInventory: boolean;
  stockQty: number;
  lowStockThreshold: number;
  variantsConfig: ProductVariantGroup[];
  isAvailable: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // generated uid for item in cart
  productId: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  qty: number;
  unitName: string;
  allowDecimalQty: boolean;
  selectedVariants: {
    groupName: string;
    optionName: string;
    priceDelta: number;
  }[];
  itemNotes?: string;
  orderType?: OrderServiceType;
  subtotal: number;
  maxStock?: number;
}

export interface OrderItemSnap {
  productId?: string;
  productName: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  unitName: string;
  variantsSelected: {
    groupName: string;
    optionName: string;
    priceDelta: number;
  }[];
  itemNotes?: string;
  orderType?: OrderServiceType;
  subtotalItem: number;
}

export interface Order {
  id: string;
  storeId: string;
  shiftId?: string;
  cashierMemberId: string;
  cashierName: string;
  invoiceNumber: string; // INV-YYYYMMDD-XXXX
  customerName?: string;
  customerPhone?: string;
  orderIdentifier?: string; // e.g. Meja 04
  items: OrderItemSnap[];
  subtotal: number;
  discountAmount: number;
  discountPercent?: number;
  taxAmount: number;
  serviceAmount: number;
  totalAmount: number;
  totalCostAmount: number; // Total HPP
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeAmount: number;
  paymentStatus: PaymentStatus;
  voidedBy?: string;
  voidReason?: string;
  syncedFromOffline: boolean;
  createdAt: string;
}

export interface CashierShift {
  id: string;
  storeId: string;
  cashierMemberId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number; // Modal awal laci
  expectedClosing?: number;
  actualClosing?: number;
  cashDifference?: number; // actual - expected
  notes?: string;
  status: 'open' | 'closed';
}

export interface CashflowEntry {
  id: string;
  storeId: string;
  shiftId?: string;
  referenceOrderId?: string;
  createdBy: string;
  creatorName: string;
  entryType: CashflowType; // income | expense
  category: string; // e.g. "Penjualan Kasir", "Bahan Baku", "Operasional", "Listrik/Air", "Gaji", "Modal Laci", "Lainnya"
  fundSource: FundSource; // 'cash_drawer' | 'bank_owner'
  amount: number;
  description: string;
  receiptPhotoUrl?: string;
  transactionDate: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  storeId: string;
  actorMemberId: string;
  actorName: string;
  action:
    | 'ORDER_VOIDED'
    | 'PRICE_OVERRIDDEN'
    | 'CASHFLOW_DELETED'
    | 'BRAND_UPDATED'
    | 'SHIFT_CLOSED'
    | 'USER_LOGIN'
    | 'STAFF_CREATED'
    | 'STAFF_UPDATED'
    | 'STAFF_STATUS_CHANGED';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface HoldOrder {
  id: string;
  customerName: string;
  orderIdentifier: string;
  items: CartItem[];
  heldAt: string;
  total: number;
}

