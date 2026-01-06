// File: components/main/product-page/cart-sidebar.tsx
import React from "react";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { CartItem } from "@/hooks/use-cart"; // Pastikan import type ini benar

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (cartId: string) => void; // UBAH TIPE KE STRING (cartId)
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
}) => {
  // Hitung total
  const totalPrice = items.reduce(
    (total, item) => total + (item.price || 0) * item.quantity,
    0
  );

  return (
    <div className={`fixed inset-0 z-[999] ${isOpen ? "block" : "hidden"}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">
              Keranjang Belanja
            </h2>
            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cart Items List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p>Keranjang Anda masih kosong</p>
            </div>
          ) : (
            items.map((item) => (
              // GUNAKAN cartId SEBAGAI KEY
              <div
                key={item.cartId}
                className="flex gap-4 p-3 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors bg-white shadow-sm"
              >
                {/* Image Placeholder / Thumbnail */}
                <div className="h-20 w-20 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                  {/* Ganti dengan <Image /> nextjs jika ada url gambar */}
                  {typeof item.image === "string" ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Tampilkan Varian & Size */}
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                      {item.variant_name && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded border">
                          Var: {item.variant_name}
                        </span>
                      )}
                      {item.size_name && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded border">
                          Size: {item.size_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-2">
                    <div className="text-sm text-gray-500">
                      {item.quantity} x{" "}
                      <span className="font-semibold text-gray-900">
                        Rp {(item.price || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <button
                      // GUNAKAN cartId DI SINI
                      onClick={() => onRemove(item.cartId)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Total */}
        {items.length > 0 && (
          <div className="p-5 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total Pesanan</span>
              <span className="font-bold text-xl text-gray-900">
                Rp {totalPrice.toLocaleString("id-ID")}
              </span>
            </div>
            <button className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg shadow-gray-200">
              Checkout Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;