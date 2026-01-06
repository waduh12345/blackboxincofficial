import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/types/admin/product";

// Perluas tipe Product untuk CartItem agar bisa menampung info varian/size
export type CartItem = Product & {
  cartId: string; // ID Unik untuk keranjang (Composite Key)
  quantity: number;
  // Field opsional untuk menampung nama variant/size
  variant_name?: string | number;
  size_name?: string | number;
  product_variant_size_id?: number | null;
};

type CartStore = {
  isOpen: boolean;
  cartItems: CartItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  // addItem sekarang menerima partial object agar bisa inject variant_name/size_name
  addItem: (
    product: Product & Partial<CartItem>,
    product_variant_id?: number
  ) => void;
  removeItem: (cartId: string) => void;
  increaseItemQuantity: (cartId: string) => void;
  decreaseItemQuantity: (cartId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      cartItems: [],

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, product_variant_id) => {
        // 1. Tentukan ID Variant & Size
        const variantId = product_variant_id ?? product.product_variant_id ?? 0;
        const sizeId = product.product_variant_size_id ?? 0;

        // 2. Buat UNIQUE KEY (cartId)
        // Format: productID-variantID-sizeID
        const uniqueCartId = `${product.id}-${variantId}-${sizeId}`;

        set((state) => {
          // Cek apakah item dengan kombinasi PERSIS sama sudah ada
          const existingItem = state.cartItems.find(
            (item) => item.cartId === uniqueCartId
          );

          if (existingItem) {
            // Jika ada, update quantity saja
            const updatedCartItems = state.cartItems.map((item) =>
              item.cartId === uniqueCartId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            return { cartItems: updatedCartItems };
          }

          // Jika tidak ada, tambah item baru dengan cartId baru
          return {
            cartItems: [
              ...state.cartItems,
              {
                ...product,
                quantity: 1,
                product_variant_id: variantId,
                product_variant_size_id: sizeId,
                cartId: uniqueCartId, // Simpan ID unik ini
              },
            ],
          };
        });
      },

      // Hapus berdasarkan cartId (bukan product id)
      removeItem: (cartId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.cartId !== cartId),
        })),

      increaseItemQuantity: (cartId) => {
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.cartId === cartId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }));
      },

      decreaseItemQuantity: (cartId) => {
        set((state) => {
          const itemToDecrease = state.cartItems.find(
            (item) => item.cartId === cartId
          );

          if (itemToDecrease && itemToDecrease.quantity > 1) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.cartId === cartId
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              ),
            };
          } else {
            return {
              cartItems: state.cartItems.filter(
                (item) => item.cartId !== cartId
              ),
            };
          }
        });
      },

      clearCart: () => set({ cartItems: [] }),

      getTotalItems: () => {
        const state = get();
        return state.cartItems.reduce(
          (total, item) => total + item.quantity,
          0
        );
      },

      getTotalPrice: () => {
        const state = get();
        return state.cartItems.reduce(
          (total, item) => total + (item.price || 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCart;