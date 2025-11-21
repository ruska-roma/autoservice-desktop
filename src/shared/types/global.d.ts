import type { AccountDetailsType } from '@/entities';
import type { ClientType, ExtClientType } from '@/entities/client';

export {};

export type PaginationParamsType = { limit: number; offset: number };

export type SearchParamsType = {
  field: string;
  query: string;
  limit: number;
  offset: number;
};

export type SearchCountParamsType = {
  field: string;
  query: string;
};

declare global {
  interface Window {
    api: {
      // Client
      clientCount(): Promise<number>;
      clientList(params: PaginationParamsType): Promise<ClientType[]>;
      clientDetails(clientId: number): Promise<ExtClientType | null>;
      clientCreate(data: Record<string, any>): Promise<{ id_client: number }>;
      clientUpdate(id: number, data: Record<string, any>): Promise<{ success: true }>;
      clientDelete(clientId: number): Promise<{ success: true }>;
      clientSearch(params: SearchParamsType): Promise<ClientType[]>;
      clientSearchCount(params: SearchCountParamsType): Promise<number>;

      // Auto
      autoCount(): Promise<number>;
      autoList(params: PaginationParamsType): Promise<ExtAutoType[]>;
      autoDetails(autoId: number): Promise<AutoType>;
      autoCreate(data: Record<string, any>): Promise<{ success: true }>;
      autoUpdate(id: number, data: Record<string, any>): Promise<{ success: true }>;
      autoDelete(autoId: number): Promise<{ success: true }>;
      autoSearch(params: SearchParamsType): Promise<ExtAutoType[]>;
      autoSearchCount(params: SearchCountParamsType): Promise<number>;

      // Account
      accountClient(accountId: number): Promise<ClientType | null>;
      accountCount(): Promise<number>;
      accountList(params: PaginationParamsType): Promise<ExtAccountType[]>;
      accountDetails(accountId: number): Promise<AccountDetailsType | null>;
      accountCreate(data: Record<string, any>): Promise<{ id_account: number }>;
      accountUpdate(id: number, data: Record<string, any>): Promise<{ success: true }>;
      accountDelete(accountId: number): Promise<{ success: true }>;
      accountSearch(params: SearchParamsType): Promise<ExtAccountType[]>;
      accountSearchCount(params: SearchCountParamsType): Promise<number>;

      // Work
      workCreate(data: Record<string, any>): Promise<{ id_work: number }>;
      workUpdate(id: number, data: Record<string, any>): Promise<{ success: true }>;
      workDelete(id: number): Promise<{ success: true }>;

      // Part
      partCreate(data: Record<string, any>): Promise<{ id_part: number }>;
      partUpdate(id: number, data: Record<string, any>): Promise<{ success: true }>;
      partDelete(id: number): Promise<{ success: true }>;

      // Master
      masterCount(): Promise<number>;
      masterList(): Promise<MasterType[]>;
      masterDetails(masterId: number): Promise<MasterType | null>;
      masterCreate(data: { name: string }): Promise<{ success: true }>;
      masterUpdate(id: number, data: { name: string }): Promise<{ success: true }>;
      masterDelete(masterId: number): Promise<{ success: true }>;

      // Company
      companyDetails(): Promise<CompanyType | null>;
      companyUpdate(data: Record<string, any>): Promise<{ success: true }>;

      // Settings
      settingsDetails(): Promise<SettingsType | null>;
      settingsUpdate(data: Record<string, any>): Promise<{ success: true }>;

      // Docs
      docsOrder(accountId: number);
    };
  }
}
