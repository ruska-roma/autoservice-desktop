import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Client
  clientCount: () => {
    return ipcRenderer.invoke('client:count');
  },
  clientList: (params: { limit: number; offset: number }) => {
    return ipcRenderer.invoke('client:list', params);
  },
  clientDetails: (clientId: number) => {
    return ipcRenderer.invoke('client:details', clientId);
  },
  clientCreate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('client:create', data);
  },
  clientUpdate: (id: number, data: Record<string, any>) => {
    return ipcRenderer.invoke('client:update', { id, data });
  },
  clientDelete: (clientId: number) => {
    return ipcRenderer.invoke('client:delete', clientId);
  },
  clientSearch: (params: { field: string; query: string; limit: number; offset: number }) => {
    return ipcRenderer.invoke('client:search', params);
  },
  clientSearchCount: (params: { field: string; query: string }) => {
    return ipcRenderer.invoke('client:search-count', params);
  },

  // Auto
  autoCount: () => {
    return ipcRenderer.invoke('auto:count');
  },
  autoList: (params: { limit: number; offset: number }) => {
    return ipcRenderer.invoke('auto:list', params);
  },
  autoDetails: (autoId: number) => {
    return ipcRenderer.invoke('auto:details', autoId);
  },
  autoCreate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('auto:create', data);
  },
  autoUpdate: (id: number, data: Record<string, any>) => {
    return ipcRenderer.invoke('auto:update', { id, data });
  },
  autoDelete: (autoId: number) => {
    return ipcRenderer.invoke('auto:delete', autoId);
  },
  autoSearch: (params: { field: string; query: string; limit: number; offset: number }) => {
    return ipcRenderer.invoke('auto:search', params);
  },
  autoSearchCount: (params: { field: string; query: string }) => {
    return ipcRenderer.invoke('auto:search-count', params);
  },

  // Account
  accountClient: (accountId: number) => {
    return ipcRenderer.invoke('account:client', accountId);
  },
  accountCount: () => {
    return ipcRenderer.invoke('account:count');
  },
  accountList: (params: { limit: number; offset: number }) => {
    return ipcRenderer.invoke('account:list', params);
  },
  accountDetails: (accountId: number) => {
    return ipcRenderer.invoke('account:details', accountId);
  },
  accountCreate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('account:create', data);
  },
  accountUpdate: (id: number, data: Record<string, any>) => {
    return ipcRenderer.invoke('account:update', { id, data });
  },
  accountDelete: (accountId: number) => {
    return ipcRenderer.invoke('account:delete', accountId);
  },
  accountSearch: (params: { field: string; query: string; limit: number; offset: number }) => {
    return ipcRenderer.invoke('account:search', params);
  },
  accountSearchCount: (params: { field: string; query: string }) => {
    return ipcRenderer.invoke('account:search-count', params);
  },

  // Work
  workCreate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('work:create', data);
  },
  workUpdate: (id: number, data: Record<string, any>) => {
    return ipcRenderer.invoke('work:update', { id, data });
  },
  workDelete: (id: number) => {
    return ipcRenderer.invoke('work:delete', id);
  },

  // Part
  partCreate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('part:create', data);
  },
  partUpdate: (id: number, data: Record<string, any>) => {
    return ipcRenderer.invoke('part:update', { id, data });
  },
  partDelete: (id: number) => {
    return ipcRenderer.invoke('part:delete', id);
  },

  // Master
  masterCount: () => {
    return ipcRenderer.invoke('master:count');
  },
  masterList: () => {
    return ipcRenderer.invoke('master:list');
  },
  masterDetails: (masterId: number) => {
    return ipcRenderer.invoke('master:details', masterId);
  },
  masterCreate: (data: { name: string }) => {
    return ipcRenderer.invoke('master:create', data);
  },
  masterUpdate: (id: number, data: { name: string }) => {
    return ipcRenderer.invoke('master:update', { id, data });
  },
  masterDelete: (masterId: number) => {
    return ipcRenderer.invoke('master:delete', masterId);
  },

  // Company
  companyDetails: () => {
    return ipcRenderer.invoke('company:details');
  },
  companyUpdate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('company:update', data);
  },

  // Settings
  settingsDetails: () => {
    return ipcRenderer.invoke('settings:details');
  },
  settingsUpdate: (data: Record<string, any>) => {
    return ipcRenderer.invoke('settings:update', data);
  },
});
