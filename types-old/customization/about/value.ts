export interface Value {
  id: number;

  client_id: string; // "5"
  bahasa: string; // "id" | "en"

  judul: string;
  deskripsi: string;

  status: boolean | string | number;

  info_judul_1: string | null;
  info_deskripsi_1: string | null;
  info_icon_1: string | null;

  info_judul_2: string | null;
  info_deskripsi_2: string | null;
  info_icon_2: string | null;

  info_judul_3: string | null;
  info_deskripsi_3: string | null;
  info_icon_3: string | null;

  info_judul_4: string;
  info_deskripsi_4: string;
  info_icon_4: string;

  image_1: File | string | null;
  image_2: File | string | null;
  image_3: File | string | null;
  image_4: File | string | null;
}