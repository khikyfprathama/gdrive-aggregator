import axios from 'axios';
import type { BaseResponse, FilesResponse, StorageOverview, Account, FileRecord } from '../types';

const STORAGE_KEY = 'gdrive_api_base_url';

export const getBaseURL = (): string => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // If running in browser, if host is 192.168.x.x use that, else default to 192.168.18.18:8081
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:8081`;
  }

  return 'http://192.168.18.18:8081';
};

export const setBaseURL = (url: string) => {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''));
};

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  return config;
});

export const apiService = {
  // Ping
  ping: async () => {
    const res = await api.get('/api/v1/ping');
    return res.data;
  },

  // Storage
  getStorageOverview: async (): Promise<StorageOverview> => {
    const res = await api.get<BaseResponse<StorageOverview>>('/api/v1/storage/overview');
    return res.data.data;
  },

  // Accounts
  getAccounts: async (): Promise<Account[]> => {
    const res = await api.get<BaseResponse<Account[]>>('/api/v1/accounts');
    return res.data.data;
  },

  syncAccount: async (id: number): Promise<Account> => {
    const res = await api.post<BaseResponse<Account>>(`/api/v1/accounts/${id}/sync`);
    return res.data.data;
  },

  deleteAccount: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/accounts/${id}`);
  },

  getGoogleAuthURL: async (): Promise<string> => {
    const res = await api.get<BaseResponse<{ auth_url: string }>>('/api/v1/auth/google/url');
    return res.data.data.auth_url;
  },

  // Files
  getFiles: async (params?: { account_id?: number; search?: string; limit?: number; offset?: number }): Promise<FilesResponse> => {
    const res = await api.get<FilesResponse>('/api/v1/files', { params });
    return res.data;
  },

  uploadFile: async (
    file: File,
    accountId?: number,
    onProgress?: (percentage: number) => void
  ): Promise<FileRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    if (accountId && accountId > 0) {
      formData.append('account_id', accountId.toString());
    }

    const res = await api.post<BaseResponse<FileRecord>>('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data.data;
  },

  downloadFile: async (id: number, fileName: string): Promise<void> => {
    const res = await api.get(`/api/v1/files/download/${id}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteFile: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/files/${id}`);
  },

  syncFiles: async (accountId?: number): Promise<{ synced_files: number; accounts_processed: number }> => {
    const params = accountId && accountId > 0 ? { account_id: accountId } : undefined;
    const res = await api.post<BaseResponse<{ synced_files: number; accounts_processed: number }>>('/api/v1/files/sync', null, { params });
    return res.data.data;
  },
};
