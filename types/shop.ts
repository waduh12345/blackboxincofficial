export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  phone: number | string;
  email: string;
  address: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  rating: string | number | null;
  total_reviews: number | null;
  status: boolean;
  logo: File | string | null;
  banner: File | string | null;
  rajaongkir_province_id: number;
  rajaongkir_city_id: number;
  rajaongkir_district_id: number;
}

export interface Region {
  id: number;
  name: string;
}