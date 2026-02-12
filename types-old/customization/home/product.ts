export interface Product {
  id: number;
  bahasa: string; // id atau en
  client_id: number; // hardcode ke 6
  judul: string;
  sub_judul: string;
  deskripsi: string;
  link: string;
  button_text: string;
  status: boolean | number;
}