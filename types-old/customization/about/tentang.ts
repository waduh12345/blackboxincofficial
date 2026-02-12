export interface AboutUs {
  id: number;
  bahasa: string; // "id" | "en"
  client_id: number; // hardcode 6
  judul: string;
  deskripsi: string;
  info_judul_1: string | null;
  info_deskripsi_1: string | null;
  info_judul_2: string | null;
  info_deskripsi_2: string | null;
  info_judul_3: string;
  info_deskripsi_3: string;
  image: File | string | null;
  visi_judul: string;
  visi_deskripsi: string;
  visi_icon: string;
  visi_image: File | string | null;
  misi_judul: string;
  misi_deskripsi: string;
  misi_icon: string;
  misi_image: File | string | null;
  status: boolean | number;
}

export interface AboutTextState {
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroTitle3: string;
  heroSubtitle: string;
  heroItem1Title: string;
  heroItem1Content: string;
  heroItem2Title: string;
  heroItem2Content: string;
  heroItem3Content: string;

  heroImage: string | File;

  misiTitle: string;
  misiSubtitle: string;
  visiTitle: string;
  visiSubtitle: string;
  valueTitle1: string;
  valueTitle2: string;
  valueSubtitle: string;
  statsTitle1: string;
  statsTitle2: string;
  statsSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn1: string;
  ctaBtn2: string;
}
