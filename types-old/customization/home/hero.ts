export interface ContentSection {
  id: number;
  client_id: number;
  bahasa: string;
  judul: string;
  sub_judul?: string;
  tagline?: string;
  deskripsi: string;
  button_text_1?: string;
  button_text_2?: string;
  info_1?: string;
  info_2?: string;
  info_3?: string;
  info_4?: string;
  info_nilai_1?: string;
  info_nilai_2?: string;
  info_nilai_3?: string;
  info_nilai_4?: string;
  image?: File | string | null;
  image_1?: File | string | null;
  image_2?: File | string | null;
  status: number;
}
