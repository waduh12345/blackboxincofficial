export interface Products {
  id: number;
  name: string;
  price: number;
  harga_coret: number;
  image: string;
  kecamatan: string;
  kategori: string;
  terlaris: boolean;
  terbaru: boolean;
  description?: string;
};