export interface FeatureSection {
  id: number;
  client_id: number;
  bahasa: string;
  judul: string;
  sub_judul: string;
  tagline: string;
  status: number;

  // Feature 1
  info_judul_1?: string;
  info_deskripsi_1?: string;
  info_icon_1?: string;

  // Feature 2
  info_judul_2?: string;
  info_deskripsi_2?: string;
  info_icon_2?: string;

  // Feature 3
  info_judul_3?: string;
  info_deskripsi_3?: string;
  info_icon_3?: string;

  // Feature 4
  info_judul_4?: string;
  info_deskripsi_4?: string;
  info_icon_4?: string;

  image_1?: File | string | null;
  image_2?: File | string | null;
  image_3?: File | string | null;
  image_4?: File | string | null;
}