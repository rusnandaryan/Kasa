import Dexie, { Table } from 'dexie';
import {
  StoreBranding,
  StoreMember,
  Category,
  Product,
  Order,
  CashflowEntry,
  CashierShift,
  AuditLog,
  BusinessType,
} from './types';

export class KasaDexieDB extends Dexie {
  stores!: Table<StoreBranding, string>;
  members!: Table<StoreMember, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  orders!: Table<Order, string>;
  cashflow!: Table<CashflowEntry, string>;
  shifts!: Table<CashierShift, string>;
  auditLogs!: Table<AuditLog, string>;

  constructor() {
    super('KasaPOSDB');
    this.version(1).stores({
      stores: 'id, brandName',
      members: 'id, storeId, role, pinCode',
      categories: 'id, storeId, sortOrder, isActive',
      products: 'id, storeId, categoryId, name, skuBarcode, isAvailable, isArchived',
      orders: 'id, storeId, shiftId, invoiceNumber, paymentStatus, createdAt',
      cashflow: 'id, storeId, shiftId, entryType, fundSource, transactionDate',
      shifts: 'id, storeId, status, openedAt',
      auditLogs: 'id, storeId, action, createdAt',
    });

    this.version(2).stores({
      categories: 'id, storeId, sortOrder, isActive',
      products: 'id, storeId, categoryId, name, skuBarcode, isAvailable, isArchived, [isArchived+isAvailable]',
    });
  }
}

export const db = new KasaDexieDB();

export const DEFAULT_STORE_ID = 'store-kasa-default-01';

export const DEFAULT_STORE_BRANDING: StoreBranding = {
  id: DEFAULT_STORE_ID,
  brandName: 'Kasa POS',
  tagline: 'Sistem Kasir & Pembukuan UMKM',
  logoUrl: '/logo.jpg', // Official application logo in *.jpg format
  themeColor: '#2563EB', // Default Royal Trust Blue
  businessType: 'fnb',
  address: 'Jl. Pemuda No. 45, Jakarta Pusat',
  phoneWhatsapp: '081234567890',
  currency: 'IDR',
  taxPercentage: 0,
  serviceChargePct: 0,
  customTerminology: {
    itemLabel: 'Menu',
    categoryLabel: 'Kategori',
    orderIdentifier: 'Nomor Meja',
  },
  receiptConfig: {
    headerText: 'Selamat Datang di Kasa POS',
    footerText: 'Terima kasih atas kunjungan Anda!\nSilakan datang kembali.',
    showLogo: true,
    paperSize: '58mm',
    showStoreAddress: true,
    showWhatsapp: true,
  },
};

export const DEFAULT_MEMBERS: StoreMember[] = [
  {
    id: 'member-owner-01',
    storeId: DEFAULT_STORE_ID,
    fullName: 'Raka (Owner/Admin)',
    role: 'owner',
    pinCode: '123456',
    isActive: true,
    permissions: {
      canDiscount: true,
      canOpenPrice: true,
      canViewDailyRevenue: true,
      canVoidOrder: true,
      canManageCatalog: true,
      canManageExpenses: true,
    },
  },
  {
    id: 'member-cashier-01',
    storeId: DEFAULT_STORE_ID,
    fullName: 'Budi (Kasir Shift Pagi)',
    role: 'cashier',
    pinCode: '112233',
    isActive: true,
    permissions: {
      canDiscount: false,
      canOpenPrice: false,
      canViewDailyRevenue: true,
      canVoidOrder: false,
      canManageCatalog: false,
      canManageExpenses: true,
    },
  },
];

export function getSampleCatalog(businessType: BusinessType, storeId: string = DEFAULT_STORE_ID): {
  categories: Category[];
  products: Product[];
  brandingUpdates: Partial<StoreBranding>;
} {
  const now = new Date().toISOString();

  if (businessType === 'retail') {
    const categories: Category[] = [
      { id: 'cat-ret-01', storeId, name: 'Sembako & Minyak', colorBadge: '#F59E0B', sortOrder: 1, isActive: true },
      { id: 'cat-ret-02', storeId, name: 'Minuman Dingin', colorBadge: '#3B82F6', sortOrder: 2, isActive: true },
      { id: 'cat-ret-03', storeId, name: 'Snack & Biskuit', colorBadge: '#EC4899', sortOrder: 3, isActive: true },
      { id: 'cat-ret-04', storeId, name: 'Sabun & Kebutuhan', colorBadge: '#10B981', sortOrder: 4, isActive: true },
    ];

    const products: Product[] = [
      {
        id: 'prod-ret-01',
        storeId,
        categoryId: 'cat-ret-01',
        name: 'Beras Ramos Super 5Kg',
        skuBarcode: '899123456001',
        sellingPrice: 75000,
        costPrice: 66000,
        unitName: 'Sak',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: true,
        stockQty: 35,
        lowStockThreshold: 5,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-ret-02',
        storeId,
        categoryId: 'cat-ret-01',
        name: 'Minyak Goreng Sawit 2L',
        skuBarcode: '899123456002',
        sellingPrice: 36000,
        costPrice: 32000,
        unitName: 'Pcs',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: true,
        stockQty: 48,
        lowStockThreshold: 8,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-ret-03',
        storeId,
        categoryId: 'cat-ret-01',
        name: 'Telur Ayam Negeri Segar',
        skuBarcode: '899123456003',
        sellingPrice: 28000,
        costPrice: 24500,
        unitName: 'Kg',
        allowDecimalQty: true, // Supports 1.5 Kg, etc.
        isOpenPrice: false,
        trackInventory: true,
        stockQty: 45,
        lowStockThreshold: 10,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-ret-04',
        storeId,
        categoryId: 'cat-ret-02',
        name: 'Teh Botol Sosro Kotak 250ml',
        skuBarcode: '899123456004',
        sellingPrice: 4000,
        costPrice: 3100,
        unitName: 'Kotak',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: true,
        stockQty: 84,
        lowStockThreshold: 12,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-ret-05',
        storeId,
        categoryId: 'cat-ret-03',
        name: 'Biskuit Roma Kelapa 300g',
        skuBarcode: '899123456005',
        sellingPrice: 11500,
        costPrice: 9500,
        unitName: 'Pcs',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: true,
        stockQty: 26,
        lowStockThreshold: 5,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    return {
      categories,
      products,
      brandingUpdates: {
        businessType: 'retail',
        themeColor: '#059669', // Emerald Fresh Green
        customTerminology: {
          itemLabel: 'Produk',
          categoryLabel: 'Kategori',
          orderIdentifier: 'Nama Pembeli / Barcode',
        },
      },
    };
  }

  if (businessType === 'service') {
    const categories: Category[] = [
      { id: 'cat-srv-01', storeId, name: 'Haircut & Styling', colorBadge: '#475569', sortOrder: 1, isActive: true },
      { id: 'cat-srv-02', storeId, name: 'Treatment & Care', colorBadge: '#8B5CF6', sortOrder: 2, isActive: true },
      { id: 'cat-srv-03', storeId, name: 'Produk Grooming', colorBadge: '#F97316', sortOrder: 3, isActive: true },
    ];

    const products: Product[] = [
      {
        id: 'prod-srv-01',
        storeId,
        categoryId: 'cat-srv-01',
        name: 'Signature Haircut + Cuci & Tonic',
        sellingPrice: 50000,
        costPrice: 10000,
        unitName: 'Sesi (45m)',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: false,
        stockQty: 0,
        lowStockThreshold: 0,
        variantsConfig: [
          {
            groupName: 'Staf Kapster',
            required: false,
            options: [
              { name: 'Senior Barber', priceDelta: 0 },
              { name: 'Master Barber (+15k)', priceDelta: 15000 },
            ],
          },
        ],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-srv-02',
        storeId,
        categoryId: 'cat-srv-01',
        name: 'Beard Trim & Hot Towel Shave',
        sellingPrice: 35000,
        costPrice: 8000,
        unitName: 'Sesi (30m)',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: false,
        stockQty: 0,
        lowStockThreshold: 0,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-srv-03',
        storeId,
        categoryId: 'cat-srv-02',
        name: 'Hair Coloring Premium Natural',
        sellingPrice: 120000,
        costPrice: 40000,
        unitName: 'Paket',
        allowDecimalQty: false,
        isOpenPrice: true, // Bisa open price sesuai panjang rambut
        trackInventory: false,
        stockQty: 0,
        lowStockThreshold: 0,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-srv-04',
        storeId,
        categoryId: 'cat-srv-03',
        name: 'Matte Clay Pomade Strong Hold 100g',
        skuBarcode: '899987654001',
        sellingPrice: 75000,
        costPrice: 45000,
        unitName: 'Pcs',
        allowDecimalQty: false,
        isOpenPrice: false,
        trackInventory: true,
        stockQty: 18,
        lowStockThreshold: 3,
        variantsConfig: [],
        isAvailable: true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    return {
      categories,
      products,
      brandingUpdates: {
        businessType: 'service',
        themeColor: '#0F172A', // Slate 900
        customTerminology: {
          itemLabel: 'Layanan',
          categoryLabel: 'Kategori',
          orderIdentifier: 'Nama Pelanggan / Kursi',
        },
      },
    };
  }

  // Default: F&B
  const categories: Category[] = [
    { id: 'cat-fnb-01', storeId, name: 'Espresso & Kopi', colorBadge: '#D97706', sortOrder: 1, isActive: true },
    { id: 'cat-fnb-02', storeId, name: 'Non-Kopi & Teh', colorBadge: '#10B981', sortOrder: 2, isActive: true },
    { id: 'cat-fnb-03', storeId, name: 'Toast & Makanan', colorBadge: '#EA580C', sortOrder: 3, isActive: true },
    { id: 'cat-fnb-04', storeId, name: 'Camilan Gurih', colorBadge: '#6366F1', sortOrder: 4, isActive: true },
  ];

  const products: Product[] = [
    {
      id: 'prod-fnb-01',
      storeId,
      categoryId: 'cat-fnb-01',
      name: 'Es Kopi Susu Gula Aren',
      sellingPrice: 22000,
      costPrice: 9500,
      unitName: 'Cup',
      allowDecimalQty: false,
      isOpenPrice: false,
      trackInventory: true,
      stockQty: 95,
      lowStockThreshold: 15,
      variantsConfig: [
        {
          groupName: 'Ukuran',
          required: false,
          options: [
            { name: 'Reguler (16oz)', priceDelta: 0 },
            { name: 'Large (22oz)', priceDelta: 4000 },
          ],
        },
        {
          groupName: 'Tingkat Manis',
          required: false,
          options: [
            { name: 'Normal Sweet', priceDelta: 0 },
            { name: 'Less Sugar (50%)', priceDelta: 0 },
            { name: 'No Sugar', priceDelta: 0 },
          ],
        },
      ],
      isAvailable: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-fnb-02',
      storeId,
      categoryId: 'cat-fnb-01',
      name: 'Americano Dingin Arabica',
      sellingPrice: 18000,
      costPrice: 6000,
      unitName: 'Cup',
      allowDecimalQty: false,
      isOpenPrice: false,
      trackInventory: true,
      stockQty: 80,
      lowStockThreshold: 10,
      variantsConfig: [],
      isAvailable: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-fnb-03',
      storeId,
      categoryId: 'cat-fnb-02',
      name: 'Matcha Latte Uji Kyoto',
      sellingPrice: 26000,
      costPrice: 12000,
      unitName: 'Cup',
      allowDecimalQty: false,
      isOpenPrice: false,
      trackInventory: true,
      stockQty: 40,
      lowStockThreshold: 8,
      variantsConfig: [
        {
          groupName: 'Extra Topping',
          required: false,
          options: [
            { name: 'Espresso Shot', priceDelta: 5000 },
            { name: 'Oatmilk Swap', priceDelta: 6000 },
          ],
        },
      ],
      isAvailable: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-fnb-04',
      storeId,
      categoryId: 'cat-fnb-03',
      name: 'Roti Toast Smoked Beef & Cheese',
      sellingPrice: 28000,
      costPrice: 13500,
      unitName: 'Porsi',
      allowDecimalQty: false,
      isOpenPrice: false,
      trackInventory: true,
      stockQty: 32,
      lowStockThreshold: 5,
      variantsConfig: [],
      isAvailable: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-fnb-05',
      storeId,
      categoryId: 'cat-fnb-04',
      name: 'Cireng Crispy Bumbu Rujak Pedas',
      sellingPrice: 16000,
      costPrice: 6500,
      unitName: 'Porsi',
      allowDecimalQty: false,
      isOpenPrice: false,
      trackInventory: true,
      stockQty: 50,
      lowStockThreshold: 10,
      variantsConfig: [],
      isAvailable: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    categories,
    products,
    brandingUpdates: {
      businessType: 'fnb',
      themeColor: '#D97706', // Coffee Amber
      customTerminology: {
        itemLabel: 'Menu',
        categoryLabel: 'Kategori',
        orderIdentifier: 'Nomor Meja',
      },
    },
  };
}

export async function initializeDatabase(): Promise<void> {
  const storeCount = await db.stores.count();
  if (storeCount === 0) {
    // Seed default store & members
    await db.stores.add(DEFAULT_STORE_BRANDING);
    await db.members.bulkAdd(DEFAULT_MEMBERS);

    // Seed default catalog (F&B)
    const { categories, products } = getSampleCatalog('fnb', DEFAULT_STORE_ID);
    await db.categories.bulkAdd(categories);
    await db.products.bulkAdd(products);

    // Seed an initial active cashier shift
    const now = new Date().toISOString();
    await db.shifts.add({
      id: 'shift-initial-01',
      storeId: DEFAULT_STORE_ID,
      cashierMemberId: 'member-cashier-01',
      cashierName: 'Budi (Kasir Shift Pagi)',
      openedAt: now,
      openingCash: 150000, // Rp 150.000 modal awal laci
      status: 'open',
    });

    // Seed a couple of initial sample orders & cashflow records for immediate rich dashboard experience
    const initialOrder1: Order = {
      id: 'ord-sample-01',
      storeId: DEFAULT_STORE_ID,
      shiftId: 'shift-initial-01',
      cashierMemberId: 'member-cashier-01',
      cashierName: 'Budi (Kasir Shift Pagi)',
      invoiceNumber: 'INV-20261111-1001',
      orderIdentifier: 'Meja 02',
      customerName: 'Dimas',
      items: [
        {
          productId: 'prod-fnb-01',
          productName: 'Es Kopi Susu Gula Aren',
          qty: 2,
          unitPrice: 22000,
          unitCost: 9500,
          unitName: 'Cup',
          variantsSelected: [{ groupName: 'Ukuran', optionName: 'Reguler (16oz)', priceDelta: 0 }],
          subtotalItem: 44000,
        },
        {
          productId: 'prod-fnb-04',
          productName: 'Roti Toast Smoked Beef & Cheese',
          qty: 1,
          unitPrice: 28000,
          unitCost: 13500,
          unitName: 'Porsi',
          variantsSelected: [],
          subtotalItem: 28000,
        },
      ],
      subtotal: 72000,
      discountAmount: 0,
      taxAmount: 0,
      serviceAmount: 0,
      totalAmount: 72000,
      totalCostAmount: 32500,
      paymentMethod: 'cash',
      amountReceived: 100000,
      changeAmount: 28000,
      paymentStatus: 'paid',
      syncedFromOffline: true,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    };

    const initialOrder2: Order = {
      id: 'ord-sample-02',
      storeId: DEFAULT_STORE_ID,
      shiftId: 'shift-initial-01',
      cashierMemberId: 'member-cashier-01',
      cashierName: 'Budi (Kasir Shift Pagi)',
      invoiceNumber: 'INV-20261111-1002',
      orderIdentifier: 'Meja 05',
      customerName: 'Siti Rahma',
      items: [
        {
          productId: 'prod-fnb-03',
          productName: 'Matcha Latte Uji Kyoto',
          qty: 1,
          unitPrice: 26000,
          unitCost: 12000,
          unitName: 'Cup',
          variantsSelected: [],
          subtotalItem: 26000,
        },
        {
          productId: 'prod-fnb-05',
          productName: 'Cireng Crispy Bumbu Rujak Pedas',
          qty: 1,
          unitPrice: 16000,
          unitCost: 6500,
          unitName: 'Porsi',
          variantsSelected: [],
          subtotalItem: 16000,
        },
      ],
      subtotal: 42000,
      discountAmount: 0,
      taxAmount: 0,
      serviceAmount: 0,
      totalAmount: 42000,
      totalCostAmount: 18500,
      paymentMethod: 'qris',
      amountReceived: 42000,
      changeAmount: 0,
      paymentStatus: 'paid',
      syncedFromOffline: true,
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    };

    await db.orders.bulkAdd([initialOrder1, initialOrder2]);

    // Initial cashflow entries
    await db.cashflow.bulkAdd([
      {
        id: 'cf-sample-01',
        storeId: DEFAULT_STORE_ID,
        shiftId: 'shift-initial-01',
        referenceOrderId: 'ord-sample-01',
        createdBy: 'member-cashier-01',
        creatorName: 'Budi (Kasir Shift Pagi)',
        entryType: 'income',
        category: 'Penjualan Kasir',
        fundSource: 'cash_drawer',
        amount: 72000,
        description: 'Penjualan INV-20261111-1001 (Tunai)',
        transactionDate: initialOrder1.createdAt,
        createdAt: initialOrder1.createdAt,
      },
      {
        id: 'cf-sample-02',
        storeId: DEFAULT_STORE_ID,
        shiftId: 'shift-initial-01',
        referenceOrderId: 'ord-sample-02',
        createdBy: 'member-cashier-01',
        creatorName: 'Budi (Kasir Shift Pagi)',
        entryType: 'income',
        category: 'Penjualan Kasir',
        fundSource: 'bank_owner',
        amount: 42000,
        description: 'Penjualan INV-20261111-1002 (QRIS)',
        transactionDate: initialOrder2.createdAt,
        createdAt: initialOrder2.createdAt,
      },
      {
        id: 'cf-sample-03',
        storeId: DEFAULT_STORE_ID,
        shiftId: 'shift-initial-01',
        createdBy: 'member-cashier-01',
        creatorName: 'Budi (Kasir Shift Pagi)',
        entryType: 'expense',
        category: 'Bahan Baku',
        fundSource: 'cash_drawer',
        amount: 25000,
        description: 'Beli Es Batu Kristal 2 Karung & Galon Aqua',
        transactionDate: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ]);
  }
}

