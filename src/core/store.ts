import { create } from 'zustand';
import {
  StoreBranding,
  StoreMember,
  CartItem,
  Product,
  HoldOrder,
  CashierShift,
  BusinessType,
} from './types';
import {
  db,
  DEFAULT_STORE_BRANDING,
  DEFAULT_MEMBERS,
  DEFAULT_STORE_ID,
  getSampleCatalog,
} from './db';
import { adjustColorDarker, getContrastingTextColor } from './formatters';

export type ActiveTab = 'pos' | 'catalog' | 'cashflow' | 'dashboard' | 'staff' | 'settings';

interface AppState {
  // Store Branding & Theme
  branding: StoreBranding;
  isInitializing: boolean;
  initStore: () => Promise<void>;
  updateBranding: (updates: Partial<StoreBranding>) => Promise<void>;
  applyThemeCssVars: (colorHex: string) => void;

  // Active Member & RBAC
  activeMember: StoreMember;
  allMembers: StoreMember[];
  isPinLocked: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  switchMember: (memberId: string) => void;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  reloadMembers: () => Promise<void>;

  // Cashier Shift
  activeShift: CashierShift | null;
  refreshShift: () => Promise<void>;

  // Online / Offline Status
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;

  // POS Cart State
  cartItems: CartItem[];
  orderIdentifier: string;
  customerName: string;
  customerPhone: string;
  discountType: 'percent' | 'nominal';
  discountValue: number;
  applyTax: boolean;
  applyService: boolean;
  heldOrders: HoldOrder[];

  // Cart Actions
  setOrderIdentifier: (val: string) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setDiscount: (type: 'percent' | 'nominal', value: number) => void;
  setApplyTax: (val: boolean) => void;
  setApplyService: (val: boolean) => void;
  addToCart: (
    product: Product,
    selectedVariants?: { groupName: string; optionName: string; priceDelta: number }[],
    notes?: string,
    customPrice?: number
  ) => void;
  updateCartItemQty: (cartItemId: string, newQty: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  holdCurrentOrder: () => void;
  restoreHeldOrder: (holdOrderId: string) => void;
  deleteHeldOrder: (holdOrderId: string) => void;

  // Switch Business Type preset
  applyBusinessPreset: (type: BusinessType) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  branding: DEFAULT_STORE_BRANDING,
  isInitializing: true,
  activeMember: DEFAULT_MEMBERS[0],
  allMembers: DEFAULT_MEMBERS,
  isPinLocked: false,
  activeTab: 'pos',
  activeShift: null,
  isOnline: true,

  // Cart initial state
  cartItems: [],
  orderIdentifier: '',
  customerName: '',
  customerPhone: '',
  discountType: 'nominal',
  discountValue: 0,
  applyTax: false,
  applyService: false,
  heldOrders: [],

  applyThemeCssVars: (colorHex: string) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const darker = adjustColorDarker(colorHex, 15);
    const textColor = getContrastingTextColor(colorHex);

    root.style.setProperty('--brand-primary', colorHex);
    root.style.setProperty('--brand-primary-dark', darker);
    root.style.setProperty('--brand-primary-text', textColor);
  },

  initStore: async () => {
    try {
      if (typeof window !== 'undefined') {
        set({ isOnline: navigator.onLine });
      }

      // Read store from db
      const store = await db.stores.get(DEFAULT_STORE_ID);
      const members = await db.members.toArray();
      const currentShift = await db.shifts.where({ status: 'open' }).first();

      const finalBranding = store || DEFAULT_STORE_BRANDING;
      const finalMembers = members.length > 0 ? members : DEFAULT_MEMBERS;
      const initialMember = finalMembers[0];

      set({
        branding: finalBranding,
        allMembers: finalMembers,
        activeMember: initialMember,
        activeShift: currentShift || null,
        isInitializing: false,
      });

      get().applyThemeCssVars(finalBranding.themeColor);
    } catch (e) {
      console.error('Failed to init store state:', e);
      set({ isInitializing: false });
    }
  },

  updateBranding: async (updates: Partial<StoreBranding>) => {
    const current = get().branding;
    const merged: StoreBranding = { ...current, ...updates };

    await db.stores.put(merged);
    set({ branding: merged });

    if (updates.themeColor) {
      get().applyThemeCssVars(updates.themeColor);
    }

    // Log brand update in audit
    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      storeId: current.id,
      actorMemberId: get().activeMember.id,
      actorName: get().activeMember.fullName,
      action: 'BRAND_UPDATED',
      description: `Memperbarui identitas brand toko: ${merged.brandName}`,
      createdAt: new Date().toISOString(),
    });
  },

  setActiveTab: (tab: ActiveTab) => {
    // RBAC check: cashier cannot view reports/dashboard or settings directly without admin override
    const { activeMember } = get();
    if (activeMember.role === 'cashier' && (tab === 'dashboard' || tab === 'settings' || tab === 'staff')) {
      alert('Akses Terbatas: Halaman ini hanya dapat diakses oleh Owner/Admin.');
      return;
    }
    set({ activeTab: tab });
  },

  switchMember: (memberId: string) => {
    const target = get().allMembers.find((m) => m.id === memberId);
    if (!target) return;

    set({ activeMember: target });
    // If cashier, ensure they land on POS
    if (target.role === 'cashier' && (get().activeTab === 'dashboard' || get().activeTab === 'settings')) {
      set({ activeTab: 'pos' });
    }
  },

  unlockWithPin: (pin: string) => {
    const { activeMember, allMembers } = get();
    // Check if PIN matches active member OR any admin/owner
    const match = allMembers.find((m) => m.pinCode === pin && m.isActive);
    if (match) {
      set({ isPinLocked: false, activeMember: match });
      return true;
    }
    return false;
  },

  lockApp: () => {
    set({ isPinLocked: true });
  },

  reloadMembers: async () => {
    const members = await db.members.toArray();
    set({ allMembers: members });
  },

  refreshShift: async () => {
    const currentShift = await db.shifts.where({ status: 'open' }).first();
    set({ activeShift: currentShift || null });
  },

  setOnlineStatus: (status: boolean) => set({ isOnline: status }),

  setOrderIdentifier: (val: string) => set({ orderIdentifier: val }),
  setCustomerInfo: (name: string, phone: string) => set({ customerName: name, customerPhone: phone }),
  setDiscount: (type: 'percent' | 'nominal', value: number) =>
    set({ discountType: type, discountValue: Math.max(0, value) }),
  setApplyTax: (val: boolean) => set({ applyTax: val }),
  setApplyService: (val: boolean) => set({ applyService: val }),

  addToCart: (product, selectedVariants = [], notes = '', customPrice) => {
    const { cartItems } = get();
    const effectiveUnitPrice = customPrice !== undefined ? customPrice : product.sellingPrice;
    const variantsDelta = selectedVariants.reduce((sum, v) => sum + v.priceDelta, 0);
    const itemUnitPrice = effectiveUnitPrice + variantsDelta;

    // Check if exact same product with exact same variants exists
    const variantKey = selectedVariants.map((v) => `${v.groupName}:${v.optionName}`).sort().join('|');
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productId === product.id &&
        item.itemNotes === notes &&
        item.selectedVariants.map((v) => `${v.groupName}:${v.optionName}`).sort().join('|') === variantKey
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const current = updated[existingIndex];
      const newQty = current.qty + 1;
      updated[existingIndex] = {
        ...current,
        qty: newQty,
        subtotal: newQty * itemUnitPrice,
      };
      set({ cartItems: updated });
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        unitPrice: itemUnitPrice,
        costPrice: product.costPrice,
        qty: 1,
        unitName: product.unitName,
        allowDecimalQty: product.allowDecimalQty,
        selectedVariants,
        itemNotes: notes,
        subtotal: itemUnitPrice,
      };
      set({ cartItems: [...cartItems, newItem] });
    }
  },

  updateCartItemQty: (cartItemId: string, newQty: number) => {
    const { cartItems } = get();
    if (newQty <= 0) {
      get().removeCartItem(cartItemId);
      return;
    }
    const updated = cartItems.map((item) => {
      if (item.id === cartItemId) {
        return {
          ...item,
          qty: newQty,
          subtotal: Math.round(newQty * item.unitPrice),
        };
      }
      return item;
    });
    set({ cartItems: updated });
  },

  removeCartItem: (cartItemId: string) => {
    const { cartItems } = get();
    set({ cartItems: cartItems.filter((item) => item.id !== cartItemId) });
  },

  clearCart: () => {
    set({
      cartItems: [],
      orderIdentifier: '',
      customerName: '',
      customerPhone: '',
      discountValue: 0,
      applyTax: false,
      applyService: false,
    });
  },

  holdCurrentOrder: () => {
    const { cartItems, orderIdentifier, customerName, heldOrders } = get();
    if (cartItems.length === 0) return;

    const subtotal = cartItems.reduce((acc, it) => acc + it.subtotal, 0);
    const newHold: HoldOrder = {
      id: `hold-${Date.now()}`,
      customerName: customerName || 'Pelanggan Umum',
      orderIdentifier: orderIdentifier || 'Tanpa Meja',
      items: [...cartItems],
      heldAt: new Date().toISOString(),
      total: subtotal,
    };

    set({
      heldOrders: [newHold, ...heldOrders],
    });
    get().clearCart();
  },

  restoreHeldOrder: (holdOrderId: string) => {
    const { heldOrders } = get();
    const target = heldOrders.find((h) => h.id === holdOrderId);
    if (!target) return;

    set({
      cartItems: target.items,
      orderIdentifier: target.orderIdentifier === 'Tanpa Meja' ? '' : target.orderIdentifier,
      customerName: target.customerName === 'Pelanggan Umum' ? '' : target.customerName,
      heldOrders: heldOrders.filter((h) => h.id !== holdOrderId),
    });
  },

  deleteHeldOrder: (holdOrderId: string) => {
    const { heldOrders } = get();
    set({ heldOrders: heldOrders.filter((h) => h.id !== holdOrderId) });
  },

  applyBusinessPreset: async (businessType: BusinessType) => {
    const { branding } = get();
    const { categories, products, brandingUpdates } = getSampleCatalog(businessType, branding.id);

    // Replace current catalog in local DB
    await db.transaction('rw', [db.categories, db.products, db.stores], async () => {
      await db.categories.clear();
      await db.products.clear();
      await db.categories.bulkAdd(categories);
      await db.products.bulkAdd(products);

      const updatedBranding: StoreBranding = {
        ...branding,
        ...brandingUpdates,
      };
      await db.stores.put(updatedBranding);
      set({ branding: updatedBranding });
      get().applyThemeCssVars(updatedBranding.themeColor);
    });

    get().clearCart();
  },
}));

