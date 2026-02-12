export interface Slider {
  id: number;
  client_id: string;
  bahasa: string; // id atau en
  judul: string;
  image: File | string | null;
  status: boolean | string | number;
}
