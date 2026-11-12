import { create } from 'zustand';
import {
  StoreBranding,
  StoreMember,
  CartItem,
  Product,
  HoldOrder,
  CashierShift,
  BusinessType,
  OrderServiceType,
} from './types';
import {
  db,
  DEFAULT_STORE_BRANDING,
  DEFAULT_MEMBERS,
  DEFAULT_STORE_ID,
  getSampleCatalog,
} from './db';
import {
  adjustColorDarker,
  formatTableLabel,
  getContrastingTextColor,
  normalizeTableKey,
} from './formatters';
import {
  canAccessTab,
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  verifyPassword,
} from './auth';

function getCartLineKey(item: Pick<CartItem, 'productId' | 'itemNotes' | 'selectedVariants' | 'orderType'>): string {
  const variantKey = item.selectedVariants
    .map((v) => `${v.groupName}:${v.optionName}`)
    .sort()
    .join('|');
  const orderType = item.orderType || 'dine_in';
  return `${item.productId}::${orderType}::${item.itemNotes || ''}::${variantKey}`;
}

function mergeCartLines(baseItems: CartItem[], incomingItems: CartItem[]): CartItem[] {
  const merged: CartItem[] = baseItems.map((item) => ({
    ...item,
    orderType: item.orderType || 'dine_in',
  }));

  for (const rawIncoming of incomingItems) {
    const incoming: CartItem = {
      ...rawIncoming,
      orderType: rawIncoming.orderType || 'dine_in',
    };
    const key = getCartLineKey(incoming);
    const existingIdx = merged.findIndex((m) => getCartLineKey(m) === key);

    if (existingIdx >= 0) {
      const existing = merged[existingIdx];
      const nextQty = existing.qty + incoming.qty;
      merged[existingIdx] = {
        ...existing,
        qty: nextQty,
        subtotal: Math.round(nextQty * existing.unitPrice),
        maxStock: incoming.maxStock ?? existing.maxStock,
      };
    } else {
      merged.push(incoming);
    }
  }

  return merged;
}

export type ActiveTab = 'pos' | 'catalog' | 'cashflow' | 'dashboard' | 'staff' | 'settings';

interface AppState {
  // Store Branding & Theme
  branding: StoreBranding;
  isInitializing: boolean;
  initStore: () => Promise<void>;
  updateBranding: (updates: Partial<StoreBranding>) => Promise<void>;
  applyThemeCssVars: (colorHex: string) => void;

  // Active Member, Auth & RBAC
  isAuthenticated: boolean;
  activeMember: StoreMember;
  allMembers: StoreMember[];
  isPinLocked: boolean;
  activeTab: ActiveTab;
  loginWithCredentials: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setActiveTab: (tab: ActiveTab) => void;
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
  activeOrderType: OrderServiceType;
  orderIdentifier: string;
  customerName: string;
  customerPhone: string;
  discountType: 'percent' | 'nominal';
  discountValue: number;
  applyTax: boolean;
  applyService: boolean;
  heldOrders: HoldOrder[];

  // Cart Actions
  setActiveOrderType: (type: OrderServiceType) => void;
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
  toggleCartItemOrderType: (cartItemId: string) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  holdCurrentOrder: () => { merged: boolean; tableLabel: string } | null;
  restoreHeldOrder: (holdOrderId: string) => void;
  mergeHeldOrderIntoCart: (holdOrderId: string) => void;
  syncMatchingHeldOrderIntoCart: () => string | null;
  deleteHeldOrder: (holdOrderId: string) => void;

  // Switch Business Type preset
  applyBusinessPreset: (type: BusinessType) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  branding: DEFAULT_STORE_BRANDING,
  isInitializing: true,
  isAuthenticated: false,
  activeMember: DEFAULT_MEMBERS[0],
  allMembers: DEFAULT_MEMBERS,
  isPinLocked: false,
  activeTab: 'pos',
  activeShift: null,
  isOnline: true,

  // Cart initial state
  cartItems: [],
  activeOrderType: 'dine_in',
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
      let members = await db.members.toArray();
      if (members.length === 0) {
        await db.members.bulkAdd(DEFAULT_MEMBERS);
        members = DEFAULT_MEMBERS;
      }
      const currentShift = await db.shifts.where({ status: 'open' }).first();

      const finalBranding = store || DEFAULT_STORE_BRANDING;
      const savedMemberId = loadAuthSession();
      const restoredMember = savedMemberId
        ? members.find((m) => m.id === savedMemberId && m.isActive)
        : undefined;
      if (savedMemberId && !restoredMember) {
        clearAuthSession();
      }

      set({
        branding: finalBranding,
        allMembers: members,
        activeMember: restoredMember || members[0],
        isAuthenticated: Boolean(restoredMember),
        activeTab: 'pos',
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

  loginWithCredentials: async (username: string, password: string) => {
    let members = await db.members.toArray();
    if (members.length === 0) {
      members = DEFAULT_MEMBERS;
    }

    const normalizedId = username.trim().toLowerCase();
    const user = members.find((m) => (m.username || '').toLowerCase() === normalizedId);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return {
        ok: false,
        error: 'ID atau password salah. Periksa kembali kredensial Anda.',
      };
    }

    if (!user.isActive) {
      return {
        ok: false,
        error: 'Akun ini sedang dinonaktifkan. Hubungi Pemilik Aplikasi atau Admin Toko.',
      };
    }

    saveAuthSession(user.id);
    set({
      allMembers: members,
      activeMember: user,
      isAuthenticated: true,
      isPinLocked: false,
      activeTab: 'pos',
    });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      storeId: get().branding.id,
      actorMemberId: user.id,
      actorName: user.fullName,
      action: 'USER_LOGIN',
      description: `Masuk ke sistem sebagai ${user.role} (${user.username})`,
      createdAt: new Date().toISOString(),
    });

    return { ok: true };
  },

  logout: () => {
    clearAuthSession();
    set({
      isAuthenticated: false,
      isPinLocked: false,
      activeTab: 'pos',
    });
    get().clearCart();
  },

  setActiveTab: (tab: ActiveTab) => {
    const { activeMember } = get();
    if (!canAccessTab(activeMember.role, tab)) {
      alert(
        tab === 'settings'
          ? 'Akses Terbatas: Branding & Pengaturan Toko hanya dapat diakses oleh Pemilik Aplikasi.'
          : 'Akses Terbatas: Anda tidak memiliki izin untuk membuka modul ini.'
      );
      return;
    }
    set({ activeTab: tab });
  },

  unlockWithPin: (pin: string) => {
    const { activeMember, allMembers } = get();
    const freshActive =
      allMembers.find((m) => m.id === activeMember.id && m.isActive) || activeMember;

    // Validate PIN strictly against the currently logged-in account so locking never switches users
    if (freshActive.isActive && freshActive.pinCode === pin) {
      set({ isPinLocked: false, activeMember: freshActive });
      return true;
    }
    return false;
  },

  lockApp: () => {
    set({ isPinLocked: true });
  },

  reloadMembers: async () => {
    const members = await db.members.toArray();
    const { activeMember, isAuthenticated } = get();
    const updatedSelf = members.find((m) => m.id === activeMember.id);

    if (isAuthenticated && (!updatedSelf || !updatedSelf.isActive)) {
      set({ allMembers: members });
      get().logout();
      return;
    }

    set({
      allMembers: members,
      activeMember: updatedSelf || activeMember,
    });
  },

  refreshShift: async () => {
    const currentShift = await db.shifts.where({ status: 'open' }).first();
    set({ activeShift: currentShift || null });
  },

  setOnlineStatus: (status: boolean) => set({ isOnline: status }),

  setActiveOrderType: (type: OrderServiceType) => set({ activeOrderType: type }),
  setOrderIdentifier: (val: string) => set({ orderIdentifier: val }),
  setCustomerInfo: (name: string, phone: string) => set({ customerName: name, customerPhone: phone }),
  setDiscount: (type: 'percent' | 'nominal', value: number) =>
    set({ discountType: type, discountValue: Math.max(0, value) }),
  setApplyTax: (val: boolean) => set({ applyTax: val }),
  setApplyService: (val: boolean) => set({ applyService: val }),

  addToCart: (product, selectedVariants = [], notes = '', customPrice) => {
    if (!product.isAvailable || (product.trackInventory && product.stockQty <= 0)) {
      return;
    }

    const { cartItems, activeOrderType } = get();
    if (product.trackInventory) {
      const totalInCartForProduct = cartItems
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + item.qty, 0);
      if (totalInCartForProduct + 1 > product.stockQty) {
        return;
      }
    }

    const effectiveUnitPrice = customPrice !== undefined ? customPrice : product.sellingPrice;
    const variantsDelta = selectedVariants.reduce((sum, v) => sum + v.priceDelta, 0);
    const itemUnitPrice = effectiveUnitPrice + variantsDelta;

    // Check if exact same product, variants, notes, AND service type (Dine In vs Take Away) exists
    const incomingKey = getCartLineKey({
      productId: product.id,
      itemNotes: notes,
      selectedVariants,
      orderType: activeOrderType,
    });
    const existingIndex = cartItems.findIndex((item) => getCartLineKey(item) === incomingKey);

    const maxStock = product.trackInventory ? product.stockQty : undefined;

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const current = updated[existingIndex];
      const newQty = current.qty + 1;
      updated[existingIndex] = {
        ...current,
        qty: newQty,
        subtotal: newQty * itemUnitPrice,
        maxStock,
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
        orderType: activeOrderType,
        subtotal: itemUnitPrice,
        maxStock,
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

    const targetItem = cartItems.find((i) => i.id === cartItemId);
    if (!targetItem) return;

    let clampedQty = newQty;
    if (targetItem.maxStock !== undefined) {
      const otherLinesQty = cartItems
        .filter((i) => i.productId === targetItem.productId && i.id !== cartItemId)
        .reduce((sum, i) => sum + i.qty, 0);
      const maxForThisLine = Math.max(0, targetItem.maxStock - otherLinesQty);
      if (clampedQty > maxForThisLine) {
        clampedQty = maxForThisLine;
      }
      if (clampedQty <= 0) {
        return;
      }
    }

    const updated = cartItems.map((item) => {
      if (item.id === cartItemId) {
        return {
          ...item,
          qty: clampedQty,
          subtotal: Math.round(clampedQty * item.unitPrice),
        };
      }
      return item;
    });
    set({ cartItems: updated });
  },

  toggleCartItemOrderType: (cartItemId: string) => {
    const { cartItems } = get();
    const target = cartItems.find((i) => i.id === cartItemId);
    if (!target) return;

    const nextType: OrderServiceType =
      (target.orderType || 'dine_in') === 'dine_in' ? 'take_away' : 'dine_in';

    const toggledItem: CartItem = { ...target, orderType: nextType };
    const withoutTarget = cartItems.filter((i) => i.id !== cartItemId);
    set({ cartItems: mergeCartLines(withoutTarget, [toggledItem]) });
  },

  removeCartItem: (cartItemId: string) => {
    const { cartItems } = get();
    set({ cartItems: cartItems.filter((item) => item.id !== cartItemId) });
  },

  clearCart: () => {
    set({
      cartItems: [],
      activeOrderType: 'dine_in',
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
    if (cartItems.length === 0 || !orderIdentifier.trim()) return null;

    const tableKey = normalizeTableKey(orderIdentifier);
    const existingIndex = tableKey
      ? heldOrders.findIndex((h) => normalizeTableKey(h.orderIdentifier) === tableKey)
      : -1;

    if (existingIndex >= 0) {
      const existing = heldOrders[existingIndex];
      const mergedItems = mergeCartLines(existing.items, cartItems);
      const mergedTotal = mergedItems.reduce((acc, it) => acc + it.subtotal, 0);
      const updatedHold: HoldOrder = {
        ...existing,
        customerName:
          customerName.trim() ||
          (existing.customerName !== 'Pelanggan Umum' ? existing.customerName : 'Pelanggan Umum'),
        items: mergedItems,
        heldAt: new Date().toISOString(),
        total: mergedTotal,
      };

      const nextHeldOrders = [...heldOrders];
      nextHeldOrders[existingIndex] = updatedHold;
      set({ heldOrders: nextHeldOrders });
      get().clearCart();
      return { merged: true, tableLabel: existing.orderIdentifier };
    }

    const tableLabel = formatTableLabel(orderIdentifier);
    const subtotal = cartItems.reduce((acc, it) => acc + it.subtotal, 0);
    const newHold: HoldOrder = {
      id: `hold-${Date.now()}`,
      customerName: customerName.trim() || 'Pelanggan Umum',
      orderIdentifier: tableLabel,
      items: cartItems.map((it) => ({ ...it, orderType: it.orderType || 'dine_in' })),
      heldAt: new Date().toISOString(),
      total: subtotal,
    };

    set({
      heldOrders: [newHold, ...heldOrders],
    });
    get().clearCart();
    return { merged: false, tableLabel };
  },

  restoreHeldOrder: (holdOrderId: string) => {
    const { heldOrders } = get();
    const target = heldOrders.find((h) => h.id === holdOrderId);
    if (!target) return;

    set({
      cartItems: target.items.map((it) => ({ ...it, orderType: it.orderType || 'dine_in' })),
      orderIdentifier: target.orderIdentifier === 'Tanpa Meja' ? '' : target.orderIdentifier,
      customerName: target.customerName === 'Pelanggan Umum' ? '' : target.customerName,
      heldOrders: heldOrders.filter((h) => h.id !== holdOrderId),
    });
  },

  mergeHeldOrderIntoCart: (holdOrderId: string) => {
    const { heldOrders, cartItems, orderIdentifier, customerName } = get();
    const target = heldOrders.find((h) => h.id === holdOrderId);
    if (!target) return;

    const mergedItems = mergeCartLines(target.items, cartItems);
    set({
      cartItems: mergedItems,
      orderIdentifier:
        orderIdentifier.trim() ||
        (target.orderIdentifier === 'Tanpa Meja' ? '' : target.orderIdentifier),
      customerName:
        customerName.trim() ||
        (target.customerName === 'Pelanggan Umum' ? '' : target.customerName),
      heldOrders: heldOrders.filter((h) => h.id !== holdOrderId),
    });
  },

  syncMatchingHeldOrderIntoCart: () => {
    const { orderIdentifier, heldOrders } = get();
    const tableKey = normalizeTableKey(orderIdentifier);
    if (!tableKey) return null;

    const match = heldOrders.find((h) => normalizeTableKey(h.orderIdentifier) === tableKey);
    if (!match) return null;

    get().mergeHeldOrderIntoCart(match.id);
    return match.orderIdentifier;
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

