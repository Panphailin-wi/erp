import { apiClient } from './api';

export interface CompanySetting {
  id: number;
  company_name: string;
  branch_name: string | null;
  tax_id: string;
  vat_number: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  enable_email: boolean;
  enable_sms: boolean;
  auto_backup: boolean;
  vat_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanySettingData {
  company_name: string;
  branch_name?: string;
  tax_id: string;
  vat_number?: string;
  address: string;
  phone?: string;
  email?: string;
  enable_email?: boolean;
  enable_sms?: boolean;
  auto_backup?: boolean;
  vat_rate?: number;
}

class CompanySettingService {
  async get(): Promise<CompanySetting> {
    const response = await apiClient.get<CompanySetting>('/company-settings');
    return response.data;
  }

  async update(data: UpdateCompanySettingData): Promise<{ message: string; data: CompanySetting }> {
    const response = await apiClient.put<{ message: string; data: CompanySetting }>(
      '/company-settings',
      data
    );
    return response.data;
  }
}

export const companySettingService = new CompanySettingService();
