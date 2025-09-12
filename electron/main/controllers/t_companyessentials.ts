import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initCompanyController(database) {
  const table = TableEnum.Company;
  const primaryKey = primaryKeys[table];
  const COMPANY_ID = 1;

  function validateCompanyData(data: any) {
    const validated: Record<string, any> = {};

    if ('legal_name' in data) {
      const legalName = (data.legal_name ?? '').trim();
      if (!legalName || legalName.length > 200) {
        throw new Error(ERRORS_MESSAGE.company.validate.legal_name);
      }
      validated.legal_name = legalName;
    }
    if ('short_name' in data) {
      const shortName = (data.short_name ?? '').trim();
      if (!shortName || shortName.length > 200) {
        throw new Error(ERRORS_MESSAGE.company.validate.short_name);
      }
      validated.short_name = shortName;
    }
    if ('address' in data) {
      const address = (data.address ?? '').trim();
      if (!address || address.length > 200) {
        throw new Error(ERRORS_MESSAGE.company.validate.address);
      }
      validated.address = address;
    }
    if ('inn' in data) {
      const inn = (data.inn ?? '').trim();
      if (!inn || inn.length > 20) {
        throw new Error(ERRORS_MESSAGE.company.validate.inn);
      }
      validated.inn = inn;
    }
    if ('kpp' in data) {
      const kpp = (data.kpp ?? '').trim();
      if (!kpp || kpp.length > 20) {
        throw new Error(ERRORS_MESSAGE.company.validate.kpp);
      }
      validated.kpp = kpp;
    }
    if ('phone' in data) {
      const phone = (data.phone ?? '').trim();
      if (!phone || phone.length > 20) {
        throw new Error(ERRORS_MESSAGE.company.validate.phone);
      }
      validated.phone = phone;
    }

    return validated;
  }

  ipcMain.handle('company:details', () => {
    const stmt = database.prepare(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`);
    const company = stmt.get(COMPANY_ID);
    if (!company) {
      throw new Error(ERRORS_MESSAGE.company.handlers.details.default);
    }
    return company;
  });

  ipcMain.handle('company:update', (_, data) => {
    const resolvedData = validateCompanyData(data);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.company.handlers.update.noNewData);
    }
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), COMPANY_ID);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.company.handlers.update.default);
    }
    return { success: true };
  });
}
