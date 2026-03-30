"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetTransactionListQuery,
  useDeleteTransactionMutation,
  useUpdateTransactionStatusMutation,
  useGetTransactionByIdQuery,
  useUpdateReceiptCodeMutation,
} from "@/services/admin/transaction.service";
import { Transaction } from "@/types/admin/transaction";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Status enum mapping
type TransactionStatusKey = 0 | 1 | 2 | -1 | -2 | -3 | -4;
type TransactionStatusInfo = { label: string; variant: "secondary" | "default" | "success" | "destructive" };

const TRANSACTION_STATUS: Record<TransactionStatusKey, TransactionStatusInfo> = {
  0: { label: "PENDING", variant: "secondary" },
  1: { label: "CAPTURED", variant: "default" },
  2: { label: "SETTLEMENT", variant: "success" },
  [-1]: { label: "DENY", variant: "destructive" },
  [-2]: { label: "EXPIRED", variant: "destructive" },
  [-3]: { label: "CANCEL", variant: "destructive" },
  [-4]: { label: "RETUR", variant: "destructive" },
};

// Helper: parse product_detail JSON safely
function parseProductDetail(detailString: string): {
  name: string;
  variant_name?: string;
  size_name?: string;
  color?: string;
  image?: string;
} {
  try {
    const d = JSON.parse(detailString);
    return {
      name: d.name || "Produk",
      variant_name: d.variant_name || d.variant || undefined,
      size_name: d.size_name || d.size || undefined,
      color: d.color || d.color_name || undefined,
      image: d.image || undefined,
    };
  } catch {
    return { name: "Data Produk Rusak" };
  }
}

export default function TransactionPage() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [receiptCode, setReceiptCode] = useState<string>("");
  const [shipmentStatus, setShipmentStatus] = useState<string>("0");
  const [isUpdatingReceipt, setIsUpdatingReceipt] = useState(false);

  // Shipping receipt/resi modal state
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingTransactionId, setShippingTransactionId] = useState<number | null>(null);
  const resiPrintRef = useRef<HTMLDivElement>(null);

  // Helper function to format currency in Rupiah
  const formatRupiah = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'Rp 0';

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount).replace('IDR', 'Rp');
  };

  // Helper function to format datetime to Indonesian format
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch (error) {
      return String(error);
    }
  };

  // Helper function to handle payment link click
  const handlePaymentLinkClick = (paymentLink: string | null) => {
    if (paymentLink && paymentLink.trim()) {
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
    }
  };

  const { data, isLoading, refetch } = useGetTransactionListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  const {
    data: transactionDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useGetTransactionByIdQuery(
    selectedTransactionId !== null ? selectedTransactionId.toString() : "",
    { skip: !selectedTransactionId }
  );

  // Shipping modal: fetch detail for the selected transaction
  const {
    data: shippingDetail,
    isLoading: isShippingDetailLoading,
  } = useGetTransactionByIdQuery(
    shippingTransactionId !== null ? shippingTransactionId.toString() : "",
    { skip: !shippingTransactionId }
  );

  const categoryList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  const [deleteTransaction] = useDeleteTransactionMutation();
  const [updateTransactionStatus] = useUpdateTransactionStatusMutation();
  const [updateReceiptCode] = useUpdateReceiptCodeMutation();

  const handleDelete = async (item: Transaction) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus Transaction?",
      text: item.reference,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteTransaction(item.id.toString()).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Transaction dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus Transaction", "error");
        console.error(error);
      }
    }
  };

  const handleStatusClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setNewStatus(transaction.status.toString());
    setIsStatusModalOpen(true);
  };

  const handleDetailClick = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setIsDetailModalOpen(true);
  };

  const handleReceiptCodeClick = (storeId: number, currentReceiptCode: string | null, currentShipmentStatus: number = 0) => {
    setSelectedStoreId(storeId);
    setReceiptCode(currentReceiptCode || "");
    setShipmentStatus(currentShipmentStatus.toString());
    setIsReceiptModalOpen(true);
  };

  // Open shipping/resi modal
  const handleShippingClick = (transactionId: number) => {
    setShippingTransactionId(transactionId);
    setIsShippingModalOpen(true);
  };

  // Print the resi content
  const handlePrintResi = () => {
    if (!resiPrintRef.current) return;
    const printContent = resiPrintRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Resi Pengiriman</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; padding: 16px; font-size: 12px; color: #000; }
            .resi-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
            .resi-header h2 { font-size: 16px; margin-bottom: 4px; }
            .resi-header p { font-size: 11px; color: #555; }
            .resi-section { margin-bottom: 12px; }
            .resi-section h3 { font-size: 13px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
            .resi-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .resi-row .label { color: #555; }
            .resi-row .value { font-weight: bold; text-align: right; }
            .resi-items { width: 100%; border-collapse: collapse; margin-top: 6px; }
            .resi-items th, .resi-items td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-size: 11px; }
            .resi-items th { background: #f0f0f0; font-weight: bold; }
            .resi-footer { text-align: center; border-top: 2px dashed #000; padding-top: 12px; margin-top: 12px; font-size: 11px; color: #555; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printContent}</body>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </html>
    `);
    printWindow.document.close();
  };

  // Process shipping: save receipt code + update status to SHIPPED, then print
  const handleProcessShipping = async () => {
    if (!shippingDetail) return;
    const store = shippingDetail.stores?.[0];
    if (!store) return;

    if (!receiptCode.trim()) {
      Swal.fire("Error", "Masukkan nomor resi terlebih dahulu", "error");
      return;
    }

    setIsUpdatingReceipt(true);
    try {
      // Update receipt code & set shipment status to SHIPPED (1)
      await updateReceiptCode({
        id: store.id,
        receipt_code: receiptCode.trim(),
        shipment_status: 1,
      }).unwrap();

      await refetch();

      // Print resi after saving
      setTimeout(() => {
        handlePrintResi();
      }, 300);

      Swal.fire("Berhasil", "Resi berhasil disimpan & dicetak", "success");
    } catch (error) {
      console.error("Error processing shipping:", error);
      Swal.fire("Gagal", "Gagal menyimpan nomor resi", "error");
    } finally {
      setIsUpdatingReceipt(false);
    }
  };

  const handleReceiptCodeUpdate = async () => {
    if (!selectedStoreId || !receiptCode.trim()) {
      Swal.fire("Error", "Nomor resi tidak boleh kosong", "error");
      return;
    }

    const parsedShipmentStatus = parseInt(shipmentStatus);
    if (isNaN(parsedShipmentStatus)) {
      Swal.fire("Error", "Status pengiriman tidak valid", "error");
      return;
    }

    const payload = {
      id: selectedStoreId,
      receipt_code: receiptCode.trim(),
      shipment_status: parsedShipmentStatus,
    };

    setIsUpdatingReceipt(true);
    try {
      await updateReceiptCode(payload).unwrap();

      setIsReceiptModalOpen(false);
      setSelectedStoreId(null);
      setReceiptCode("");
      setShipmentStatus("0");

      setTimeout(() => {
        Swal.fire("Berhasil", "Nomor resi dan status pengiriman berhasil diperbarui", "success");
      }, 100);

      await refetch();
    } catch (error) {
      console.error("Error updating receipt code:", error);

      setIsReceiptModalOpen(false);
      setSelectedStoreId(null);
      setReceiptCode("");
      setShipmentStatus("0");

      setTimeout(() => {
        Swal.fire("Gagal", "Gagal memperbarui nomor resi", "error");
      }, 100);
    } finally {
      setIsUpdatingReceipt(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTransaction) return;

    setIsUpdatingStatus(true);
    try {
      await updateTransactionStatus({
        id: selectedTransaction.id.toString(),
        status: parseInt(newStatus),
      }).unwrap();

      setIsStatusModalOpen(false);
      setSelectedTransaction(null);

      setTimeout(() => {
        Swal.fire("Berhasil", "Status transaction berhasil diubah", "success");
      }, 100);

      await refetch();
    } catch (error) {
      setIsStatusModalOpen(false);
      setSelectedTransaction(null);

      setTimeout(() => {
        Swal.fire("Gagal", "Gagal mengubah status transaction", "error");
      }, 100);
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelTransaction = async (item: Transaction) => {
    const confirm = await Swal.fire({
      title: "Batalkan Transaksi?",
      text: `Transaksi ${item.reference} akan dibatalkan. Stok akan dikembalikan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      try {
        await updateTransactionStatus({
          id: item.id.toString(),
          status: -3,
        }).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Transaksi berhasil dibatalkan", "success");
      } catch (error) {
        const message =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { message?: string } }).data?.message
            : undefined;
        Swal.fire("Gagal", message ?? "Gagal membatalkan transaksi", "error");
      }
    }
  };

  const handleReturTransaction = async (item: Transaction) => {
    const confirm = await Swal.fire({
      title: "Retur Transaksi?",
      text: `Transaksi ${item.reference} akan diretur. Stok dikembalikan dan sales berkurang.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Retur",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      try {
        await updateTransactionStatus({
          id: item.id.toString(),
          status: -4,
        }).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Transaksi berhasil diretur", "success");
      } catch (error) {
        const message =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { message?: string } }).data?.message
            : undefined;
        Swal.fire("Gagal", message ?? "Gagal meretur transaksi", "error");
      }
    }
  };

  const getStatusInfo = (status: number) => {
    return TRANSACTION_STATUS[status as TransactionStatusKey] || { label: "UNKNOWN", variant: "secondary" };
  };

  const getShipmentStatusInfo = (status: number) => {
    const statusMap: Record<number, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
      0: { label: "PENDING", variant: "secondary" },
      1: { label: "SHIPPED", variant: "default" },
      2: { label: "DELIVERED", variant: "success" },
      3: { label: "RETURNED", variant: "destructive" },
      4: { label: "CANCELLED", variant: "destructive" },
    };
    return statusMap[status] || { label: "UNKNOWN", variant: "secondary" };
  };

  // Check if a transaction has been processed (has receipt code on any store)
  const isTransactionProcessed = (item: Transaction): boolean => {
    return item.stores?.some(store => store.receipt_code && store.shipment_status >= 1) ?? false;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Data Transaksi</h1>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 whitespace-nowrap">Aksi</th>
                <th className="px-2 py-2 whitespace-nowrap">ID</th>
                <th className="px-4 py-2 whitespace-nowrap">Customer</th>
                <th className="px-4 py-2 whitespace-nowrap">Harga</th>
                <th className="px-4 py-2 whitespace-nowrap">Diskon</th>
                <th className="px-4 py-2 whitespace-nowrap">Biaya Pengiriman</th>
                <th className="px-4 py-2 whitespace-nowrap">Total harga</th>
                <th className="px-4 py-2 whitespace-nowrap">Payment Link</th>
                <th className="px-4 py-2 whitespace-nowrap">Pengiriman</th>
                <th className="px-4 py-2 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-2 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : categoryList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                categoryList.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  const processed = isTransactionProcessed(item);
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
                          >
                            Hapus
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleDetailClick(item.id)}
                          >
                            Detail
                          </Button>
                          {item.status === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleCancelTransaction(item)}
                            >
                              Cancel
                            </Button>
                          )}
                          {(item.status === 1 || item.status === 2) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleReturTransaction(item)}
                            >
                              Retur
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.reference}</td>
                      <td className="px-4 py-2">{item.user_name}</td>
                      <td className="px-4 py-2 font-medium text-green-600">
                        {formatRupiah(item.total)}
                      </td>
                      <td className="px-4 py-2 font-medium text-orange-600">
                        {formatRupiah(item.discount_total)}
                      </td>
                      <td className="px-4 py-2 font-medium text-blue-600">
                        {formatRupiah(item.shipment_cost)}
                      </td>
                      <td className="px-4 py-2 font-bold text-green-700">
                        {formatRupiah(item.grand_total)}
                      </td>
                      <td className="px-4 py-2">
                        {item.payment_link ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto"
                            onClick={() => handlePaymentLinkClick(item.payment_link)}
                          >
                            Buka Link
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Tidak ada link
                          </span>
                        )}
                      </td>
                      {/* Kolom Pengiriman: Atur Pengiriman / Sudah Diproses */}
                      <td className="px-4 py-2">
                        {(item.status === 1 || item.status === 2) ? (
                          processed ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="success" className="text-xs whitespace-nowrap">
                                Sudah Diproses
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs px-1 py-0 h-auto text-blue-600 hover:text-blue-800"
                                onClick={() => {
                                  setReceiptCode("");
                                  handleShippingClick(item.id);
                                }}
                              >
                                Lihat / Cetak Ulang
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs whitespace-nowrap"
                              onClick={() => {
                                setReceiptCode("");
                                handleShippingClick(item.id);
                              }}
                            >
                              Atur Pengiriman
                            </Button>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={statusInfo.variant}
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => handleStatusClick(item)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="p-4 flex items-center justify-between bg-muted">
          <div className="text-sm">
            Halaman <strong>{currentPage}</strong> dari{" "}
            <strong>{lastPage}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Transaksi: {selectedTransaction?.reference}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Customer: {selectedTransaction?.user_name}
              </p>
              {selectedTransaction?.stores && selectedTransaction.stores.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Nomor Resi:</strong>
                  </p>
                  {selectedTransaction.stores.filter(store => store).map((store, index) => (
                    <div key={index} className="mb-2 p-2 border rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          Toko {store.shop?.name || store.shop_id || 'Unknown'}:
                        </span>
                        <Badge variant={getShipmentStatusInfo(store.shipment_status).variant} className="text-xs">
                          {getShipmentStatusInfo(store.shipment_status).label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Resi:</span>
                        {store.receipt_code ? (
                          <span
                            className="text-sm font-medium text-green-600 cursor-pointer hover:underline"
                            onClick={() => handleReceiptCodeClick(store.id, store.receipt_code, store.shipment_status)}
                            title="Klik untuk mengedit nomor resi"
                          >
                            {store.receipt_code}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto"
                            onClick={() => handleReceiptCodeClick(store.id, store.receipt_code, store.shipment_status)}
                          >
                            Input Resi
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Pilih Status Baru:
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">PENDING</SelectItem>
                  <SelectItem value="1">CAPTURED</SelectItem>
                  <SelectItem value="2">SETTLEMENT</SelectItem>
                  <SelectItem value="-1">DENY</SelectItem>
                  <SelectItem value="-2">EXPIRED</SelectItem>
                  <SelectItem value="-3">CANCEL</SelectItem>
                  <SelectItem value="-4">RETUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={isUpdatingStatus}
              >
                Batal
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? "Memperbarui..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {isDetailLoading ? (
            <div className="text-center p-8">Memuat detail...</div>
          ) : isDetailError || !transactionDetail ? (
            <div className="text-center p-8 text-red-500">
              Gagal memuat detail transaksi.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ringkasan Transaksi</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>ID Transaksi:</strong> {transactionDetail.reference}</p>
                  <p><strong>Nama Pelanggan:</strong> {transactionDetail.user_name}</p>
                  <p><strong>Tanggal:</strong> {formatDateTime(transactionDetail.created_at)}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge variant={getStatusInfo(transactionDetail.status).variant}>
                      {getStatusInfo(transactionDetail.status).label}
                    </Badge>
                  </p>
                  <p><strong>Metode Pembayaran:</strong> {transactionDetail.payment_method}</p>
                  {transactionDetail.expires_at && (
                    <p><strong>Kedaluwarsa:</strong> {formatDateTime(transactionDetail.expires_at)}</p>
                  )}
                </div>

                {/* Payment Proof */}
                {transactionDetail.payment_proof && (
                  <div className="mt-4">
                    <h4 className="text-base font-semibold">Bukti Pembayaran</h4>
                    <a href={transactionDetail.payment_proof} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={transactionDetail.payment_proof}
                        alt="Bukti Pembayaran"
                        width={400}
                        height={300}
                        className="w-full h-auto mt-2 rounded-lg object-contain border"
                      />
                    </a>
                  </div>
                )}
              </div>

              {/* Right Column: Items and Shipping */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Produk</h3>
                  <div className="space-y-2">
                    {transactionDetail.stores.flatMap(store => store.details).map((item, index) => {
                      const pd = parseProductDetail(item.product_detail);
                      return (
                        <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{pd.name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {pd.variant_name && <span>Warna: {pd.variant_name}</span>}
                              {pd.size_name && <span>Size: {pd.size_name}</span>}
                            </div>
                            <p className="text-muted-foreground">Jumlah: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">{formatRupiah(item.total)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping Details */}
                {transactionDetail.stores.length > 0 && transactionDetail.stores[0] && (
                  <div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Alamat:</strong> {transactionDetail.address_line_1} {transactionDetail.postal_code}</p>
                      <p><strong>Kurir:</strong> {(() => { try { const s = JSON.parse(transactionDetail.stores[0].shipment_detail); return `${s.name} (${s.service})`; } catch { return transactionDetail.stores[0].courier; } })()}</p>
                      <p><strong>Biaya:</strong> {formatRupiah(transactionDetail.shipment_cost)}</p>
                      <div className="flex items-center gap-2">
                        <p><strong>Status Pengiriman:</strong></p>
                        <Badge variant={getShipmentStatusInfo(transactionDetail.stores[0].shipment_status).variant}>
                          {getShipmentStatusInfo(transactionDetail.stores[0].shipment_status).label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p><strong>Nomor Resi:</strong></p>
                        {transactionDetail.stores[0].receipt_code ? (
                        <span
                          className="text-sm font-medium text-green-600 cursor-pointer hover:underline"
                          onClick={() => handleReceiptCodeClick(transactionDetail.stores[0].id, transactionDetail.stores[0].receipt_code, transactionDetail.stores[0].shipment_status)}
                          title="Klik untuk mengedit nomor resi"
                        >
                            {transactionDetail.stores[0].receipt_code}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto"
                            onClick={() => handleReceiptCodeClick(transactionDetail.stores[0].id, transactionDetail.stores[0].receipt_code, transactionDetail.stores[0].shipment_status)}
                          >
                            Input Resi
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-base font-medium">
                    <span>Total Harga:</span>
                    <span>{formatRupiah(transactionDetail.total)}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium text-orange-600">
                    <span>Diskon:</span>
                    <span>{formatRupiah(transactionDetail.discount_total)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span>Total Akhir:</span>
                    <span>{formatRupiah(transactionDetail.grand_total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Code Modal (legacy - for direct resi input) */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Nomor Resi & Status Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nomor Resi:
              </label>
              <Input
                value={receiptCode}
                onChange={(e) => setReceiptCode(e.target.value)}
                placeholder="Masukkan nomor resi"
                disabled={isUpdatingReceipt}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Status Pengiriman:
              </label>
              <Select value={shipmentStatus} onValueChange={setShipmentStatus} disabled={isUpdatingReceipt}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status pengiriman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">PENDING</SelectItem>
                  <SelectItem value="1">SHIPPED</SelectItem>
                  <SelectItem value="2">DELIVERED</SelectItem>
                  <SelectItem value="3">RETURNED</SelectItem>
                  <SelectItem value="4">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsReceiptModalOpen(false)}
                disabled={isUpdatingReceipt}
              >
                Batal
              </Button>
              <Button
                onClick={handleReceiptCodeUpdate}
                disabled={isUpdatingReceipt}
              >
                {isUpdatingReceipt ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipping / Resi Modal - New */}
      <Dialog open={isShippingModalOpen} onOpenChange={(open) => {
        setIsShippingModalOpen(open);
        if (!open) {
          setShippingTransactionId(null);
          setReceiptCode("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atur Pengiriman & Cetak Resi</DialogTitle>
          </DialogHeader>

          {isShippingDetailLoading ? (
            <div className="text-center p-8">Memuat data pesanan...</div>
          ) : !shippingDetail ? (
            <div className="text-center p-8 text-red-500">Gagal memuat data.</div>
          ) : (() => {
            const store = shippingDetail.stores?.[0];
            const alreadyProcessed = store?.receipt_code && store.shipment_status >= 1;
            let courierInfo = { name: "", service: "" };
            try {
              if (store?.shipment_detail) courierInfo = JSON.parse(store.shipment_detail);
            } catch { /* ignore */ }

            const allItems = shippingDetail.stores.flatMap(s => s.details);

            return (
              <div className="space-y-4">
                {/* Status indicator */}
                {alreadyProcessed && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <Badge variant="success">Sudah Diproses</Badge>
                    <span className="text-sm text-green-700">Resi: <strong>{store?.receipt_code}</strong></span>
                  </div>
                )}

                {/* Printable Resi Content */}
                <div ref={resiPrintRef}>
                  <div className="resi-header" style={{ textAlign: "center", borderBottom: "2px dashed #ccc", paddingBottom: 12, marginBottom: 12 }}>
                    <h2 style={{ fontSize: 16, fontWeight: "bold" }}>RESI PENGIRIMAN</h2>
                    <p style={{ fontSize: 12, color: "#666" }}>{shippingDetail.reference} | {formatDateTime(shippingDetail.created_at)}</p>
                  </div>

                  <div className="resi-section" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: 4, marginBottom: 6 }}>Informasi Pembeli</h3>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#666" }}>Nama:</span>
                        <span style={{ fontWeight: "bold" }}>{shippingDetail.user_name || shippingDetail.guest_name || "-"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#666" }}>No. HP:</span>
                        <span style={{ fontWeight: "bold" }}>{shippingDetail.guest_phone || "-"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#666" }}>Email:</span>
                        <span style={{ fontWeight: "bold" }}>{shippingDetail.user_email || shippingDetail.guest_email || "-"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#666" }}>Alamat:</span>
                        <span style={{ fontWeight: "bold", textAlign: "right", maxWidth: "60%" }}>{shippingDetail.address_line_1} {shippingDetail.postal_code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="resi-section" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: 4, marginBottom: 6 }}>Pengiriman</h3>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#666" }}>Kurir:</span>
                        <span style={{ fontWeight: "bold" }}>{(courierInfo.name || store?.courier || "").toUpperCase()} - {courierInfo.service || ""}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ color: "#666" }}>No. Resi:</span>
                        <span style={{ fontWeight: "bold" }}>{store?.receipt_code || receiptCode || "(belum diisi)"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="resi-section" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: 4, marginBottom: 6 }}>Detail Pesanan</h3>
                    <table className="resi-items" style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                          <th style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "left" }}>Produk</th>
                          <th style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "center" }}>Qty</th>
                          <th style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "center" }}>Varian/Warna</th>
                          <th style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "center" }}>Size</th>
                          <th style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "right" }}>Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allItems.map((detail, idx) => {
                          const pd = parseProductDetail(detail.product_detail);
                          return (
                            <tr key={idx}>
                              <td style={{ border: "1px solid #ddd", padding: "4px 6px" }}>{pd.name}</td>
                              <td style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "center" }}>{detail.quantity}</td>
                              <td style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "center" }}>{pd.variant_name || pd.color || "-"}</td>
                              <td style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "center" }}>{pd.size_name || "-"}</td>
                              <td style={{ border: "1px solid #ddd", padding: "4px 6px", textAlign: "right" }}>{formatRupiah(detail.total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="resi-footer" style={{ textAlign: "center", borderTop: "2px dashed #ccc", paddingTop: 12, marginTop: 12, fontSize: 11, color: "#666" }}>
                    <p>Total: <strong>{formatRupiah(shippingDetail.grand_total)}</strong></p>
                    <p style={{ marginTop: 4 }}>Terima kasih telah berbelanja!</p>
                  </div>
                </div>

                {/* Input Resi (only if not yet processed) */}
                {!alreadyProcessed && (
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Nomor Resi:</label>
                      <Input
                        value={receiptCode}
                        onChange={(e) => setReceiptCode(e.target.value)}
                        placeholder="Masukkan nomor resi pengiriman"
                        disabled={isUpdatingReceipt}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsShippingModalOpen(false)}
                  >
                    Tutup
                  </Button>
                  {alreadyProcessed ? (
                    <Button onClick={handlePrintResi}>
                      Cetak Ulang Resi
                    </Button>
                  ) : (
                    <Button
                      onClick={handleProcessShipping}
                      disabled={isUpdatingReceipt || !receiptCode.trim()}
                    >
                      {isUpdatingReceipt ? "Memproses..." : "Simpan & Cetak Resi"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
