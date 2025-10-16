"use client";

import { useMemo, useState } from "react";
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
import { PageHeader } from "@/components/ui/page-header";

type TransactionStatusKey = 0 | 1 | 2 | -1 | -2 | -3;
type TransactionStatusInfo = {
  label: string;
  variant: "secondary" | "default" | "success" | "destructive";
};

const TRANSACTION_STATUS: Record<TransactionStatusKey, TransactionStatusInfo> =
  {
    0: { label: "PENDING", variant: "secondary" },
    1: { label: "CAPTURED", variant: "default" },
    2: { label: "SETTLEMENT", variant: "success" },
    [-1]: { label: "DENY", variant: "destructive" },
    [-2]: { label: "EXPIRED", variant: "destructive" },
    [-3]: { label: "CANCEL", variant: "destructive" },
  };

export default function TransactionPage() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 🔎 search text untuk header (tanpa button apapun)
  const [search, setSearch] = useState("");

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [receiptCode, setReceiptCode] = useState<string>("");
  const [shipmentStatus, setShipmentStatus] = useState<string>("0");
  const [isUpdatingReceipt, setIsUpdatingReceipt] = useState(false);

  const formatRupiah = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(numAmount)
      .replace("IDR", "Rp");
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    } catch (error) {
      return String(error);
    }
  };

  const handlePaymentLinkClick = (paymentLink: string | null) => {
    if (paymentLink && paymentLink.trim()) {
      window.open(paymentLink, "_blank", "noopener,noreferrer");
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

  const rawList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  // 🔎 Filter client-side berdasarkan search (reference / customer / payment link)
  const categoryList = useMemo(() => {
    if (!search.trim()) return rawList;
    const q = search.toLowerCase();
    return rawList.filter((t) => {
      const ref = t.reference?.toLowerCase() ?? "";
      const name = t.user_name?.toLowerCase() ?? "";
      const pay = t.payment_link?.toLowerCase() ?? "";
      return ref.includes(q) || name.includes(q) || pay.includes(q);
    });
  }, [rawList, search]);

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

  const handleReceiptCodeClick = (
    storeId: number,
    currentReceiptCode: string | null,
    currentShipmentStatus: number = 0
  ) => {
    setSelectedStoreId(storeId);
    setReceiptCode(currentReceiptCode || "");
    setShipmentStatus(currentShipmentStatus.toString());
    setIsReceiptModalOpen(true);
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
        Swal.fire(
          "Berhasil",
          "Nomor resi dan status pengiriman berhasil diperbarui",
          "success"
        );
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

  const getStatusInfo = (status: number) =>
    TRANSACTION_STATUS[status as TransactionStatusKey] || {
      label: "UNKNOWN",
      variant: "secondary",
    };

  const getShipmentStatusInfo = (status: number) => {
    const statusMap: Record<
      number,
      {
        label: string;
        variant: "secondary" | "default" | "success" | "destructive";
      }
    > = {
      0: { label: "PENDING", variant: "secondary" },
      1: { label: "SHIPPED", variant: "default" },
      2: { label: "DELIVERED", variant: "success" },
      3: { label: "RETURNED", variant: "destructive" },
      4: { label: "CANCELLED", variant: "destructive" },
    };
    return statusMap[status] || { label: "UNKNOWN", variant: "secondary" };
  };

  const formatProductDetail = (detailString: string) => {
    try {
      const detail = JSON.parse(detailString);
      return detail.name || "Nama Produk Tidak Diketahui";
    } catch {
      return "Data Produk Rusak";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header reusable: hanya judul + search (tanpa button apapun) */}
      <PageHeader
        title="Data Transaksi"
        searchPlaceholder="Cari ref/customer/payment link…"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setCurrentPage(1);
        }}
      />

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
                <th className="px-4 py-2 whitespace-nowrap">
                  Biaya Pengiriman
                </th>
                <th className="px-4 py-2 whitespace-nowrap">Total harga</th>
                <th className="px-4 py-2 whitespace-nowrap">Payment Link</th>
                <th className="px-4 py-2 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-2 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : categoryList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                categoryList.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
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
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.reference}
                      </td>
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
                            onClick={() =>
                              handlePaymentLinkClick(item.payment_link)
                            }
                          >
                            Buka Link
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Tidak ada link
                          </span>
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
              {selectedTransaction?.stores &&
                selectedTransaction.stores.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Nomor Resi:</strong>
                    </p>
                    {selectedTransaction.stores
                      .filter((store) => store)
                      .map((store, index) => (
                        <div key={index} className="mb-2 p-2 border rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              Toko{" "}
                              {store.shop?.name || store.shop_id || "Unknown"}:
                            </span>
                            <Badge
                              variant={
                                getShipmentStatusInfo(store.shipment_status)
                                  .variant
                              }
                              className="text-xs"
                            >
                              {
                                getShipmentStatusInfo(store.shipment_status)
                                  .label
                              }
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Resi:
                            </span>
                            {store.receipt_code ? (
                              <span
                                className="text-sm font-medium text-green-600 cursor-pointer hover:underline"
                                onClick={() =>
                                  handleReceiptCodeClick(
                                    store.id,
                                    store.receipt_code,
                                    store.shipment_status
                                  )
                                }
                                title="Klik untuk mengedit nomor resi"
                              >
                                {store.receipt_code}
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={() =>
                                  handleReceiptCodeClick(
                                    store.id,
                                    store.receipt_code,
                                    store.shipment_status
                                  )
                                }
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
              <Button onClick={handleStatusUpdate} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? "Memperbarui..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Code Modal */}
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
              <Select
                value={shipmentStatus}
                onValueChange={setShipmentStatus}
                disabled={isUpdatingReceipt}
              >
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
    </div>
  );
}