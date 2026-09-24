export interface Account {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string;
  storage_limit: number;
  storage_usage: number;
  usage_in_drive?: number;
  usage_in_trash?: number;
  free_storage?: number;
  storage_limit_str?: string;
  storage_usage_str?: string;
  free_storage_str?: string;
  usage_percent?: number;
  is_active: boolean;
  created_at?: string;
}

export interface FileRecord {
  id: number;
  account_id: number;
  account_email: string;
  drive_file_id: string;
  name: string;
  mime_type: string;
  size: number;
  md5_checksum?: string;
  web_view_link?: string;
  icon_link?: string;
  is_folder?: boolean;
  parent_id?: string;
  created_at: string;
}

export interface StorageOverview {
  total_limit_bytes: number;
  total_usage_bytes: number;
  total_free_bytes: number;
  total_limit_human: string;
  total_usage_human: string;
  total_free_human: string;
  usage_percentage: number;
  account_count: number;
  accounts: Account[];
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface FilesResponse {
  success: boolean;
  message: string;
  total: number;
  limit: number;
  offset: number;
  data: FileRecord[];
}
