export interface GlobalSetting {
  id: number;
  site_name: string;
  site_description: string;
  meta_keywords: string;
  meta_author: string;
  footer_text: string;
  footer_copyright: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_youtube: string;
  logo: string | null;
  favicon: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingResponse {
  code: number;
  message: string;
  data: GlobalSetting;
}
