import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initSettingsController(database) {
  const table = TableEnum.Settings;
  const primaryKey = primaryKeys[table];
  const SETTINGS_ID = 1;

  function validateSettingsData(data: any) {
    const validated: Record<string, any> = {};

    if ('pass_hash' in data) {
      const passHash = (data.pass_hash ?? '').toString().trim();
      if (!passHash || passHash.length > 200) {
        throw new Error(ERRORS_MESSAGE.settings.validate.pass_hash);
      }
      validated.pass_hash = passHash;
    }
    if ('standard_hour' in data) {
      const standardHour = Number(data.standard_hour);
      if (!Number.isFinite(standardHour) || standardHour < 0) {
        throw new Error(ERRORS_MESSAGE.settings.validate.standard_hour);
      }
      validated.standard_hour = standardHour;
    }

    return validated;
  }

  ipcMain.handle('settings:details', () => {
    const stmt = database.prepare(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`);
    const settings = stmt.get(SETTINGS_ID);
    if (!settings) {
      throw new Error(ERRORS_MESSAGE.settings.handlers.details.default);
    }
    return settings;
  });

  ipcMain.handle('settings:update', (_, data) => {
    const resolvedData = validateSettingsData(data);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.settings.handlers.update.noNewData);
    }
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), SETTINGS_ID);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.settings.handlers.update.default);
    }
    return { success: true };
  });
}
