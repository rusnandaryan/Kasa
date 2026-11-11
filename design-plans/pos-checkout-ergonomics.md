# POS Terminal & Checkout Ergonomics Improvement Plan

Written against: 00765a5

## Evidence chain

- Surface: `Kasa/src/components/pos/CartPanel.tsx`, `Kasa/src/components/pos/PaymentModal.tsx`, `Kasa/src/components/pos/POSTerminal.tsx`
- Problem:
  1. Quantity steppers in cart have sub-optimal touch target size (32px × 32px vs recommended 40px+ in high-frequency POS rush hours).
  2. Cash payment amount input lacks live formatted currency delimiter feedback, conflicting with system-wide tabular formatted currency convention.
  3. Keyboard shortcuts (F2, F8, F9) are fragmented across disparate input placeholders rather than anchored as a coherent terminal accelerator bar.
- Design evidence: `design-system/kasa-pos/MASTER.md` (Density 8/10, Button & Control specs, Currency format contract).
- Owner: `Kasa/src/components/pos/CartPanel.tsx`, `PaymentModal.tsx`, `POSTerminal.tsx`
- Scope and affected surfaces: POS Terminal checkout view on desktop, tablet, and mobile.
- Uncertainty: None.

## Design decision

Enforce physical tactile safety and clear visual feedback across the checkout surface by enlarging stepper buttons to 40px (`w-10 h-10`), providing real-time Rupiah delimiter subtitle below raw cash input, and adding a subtle keyboard accelerator bar in the terminal header.

## Reuse

- Existing tokens: `--brand-primary`, `rounded-xl`, `tabular-nums font-extrabold`, `formatRupiah()`.
- Exemplar: `PaymentModal.tsx:214` (`formatRupiah(grandTotal)`), `CartPanel.tsx:350` (`h-14` CTA button).

## Changes

1. `Kasa/src/components/pos/CartPanel.tsx`
   - Change: Enlarge quantity stepper container from `h-8` with `w-8` buttons to `h-10` with `w-10` buttons (`w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200`) and counter to `w-12 text-sm font-bold`.
   - Preserve: Existing step logic (decimal vs integer increments), `aria-label`, and styling tokens.
   - Verify: Stepper touch area expands to 40px × 40px without overflowing the cart item row layout.

2. `Kasa/src/components/pos/PaymentModal.tsx`
   - Change: Add a live formatted confirmation label directly beneath the cash input: `{cashReceived > 0 && <p className="text-xs font-bold text-blue-600 mt-1 tabular-nums">Terbaca: {formatRupiah(cashReceived)}</p>}`.
   - Preserve: Unmodified native `<input type="number">` behavior for tactile numeric keypad compatibility.
   - Verify: Typing `50000` immediately renders "Terbaca: Rp 50.000" below the input box.

3. `Kasa/src/components/pos/POSTerminal.tsx`
   - Change: Add a subtle shortcut anchor bar above the split grid: an inline container displaying pill badges for `F2: Cari Menu`, `F8: Bayar`, `F9: Cetak Struk`.
   - Preserve: Split screen 65/35 desktop layout and mobile single-view toggle.
   - Verify: Shortcuts are clearly visible at a glance to the cashier.

## Scope

- Inherit: Desktop, tablet, and mobile POS checkout views.
- Verify: Cart list scrolling performance and payment modal keying behavior.
- Exclude: Non-POS modules (Catalog, Cashflow, Dashboard, Staff, Settings).

## Validation

- Product: Cashier item increment/decrement and cash payment entry.
- Interface: Viewports 375px (mobile), 768px (tablet), 1024px (desktop).
- System: Confirm reuse of `formatRupiah` formatter and Tailwind sizing tokens.
- Repository: `npm run build` → exit code 0.

## Stop conditions

- Stop if modifying stepper width causes cart item text truncation on 375px viewports.

## Design documentation

- Record in `.youngster/` and `MASTER.md` component guidelines under POS Terminal Specs.

