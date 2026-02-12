export interface About {
  id: number;
  client_id: string; // hardcode 6
  bahasa: string; // id atau en
  judul: string;
  sub_judul: string;
  deskripsi: string;
  image: File | string | null;
  status: string;
  info_1: string;
  info_2: string;
  info_3: string;
  info_4: string;
}
