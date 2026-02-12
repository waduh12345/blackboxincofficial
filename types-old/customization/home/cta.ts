export interface CTA {
  id: number;
  bahasa: string; // "id" | "en"
  client_id: number; // biasanya hardcode 6
  judul: string;
  sub_judul: string;
  deskripsi: string;
  button_1: string;
  button_2: string;
  button_link_1: string;
  button_link_2: string;
  info_judul_1: string;
  info_deskripsi_1: string;
  info_judul_2: string;
  info_deskripsi_2: string;
  info_judul_3: string;
  info_deskripsi_3: string;
  info_judul_4: string;
  info_deskripsi_4: string;
  status: boolean | number;
}
