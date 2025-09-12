import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initMasterController(database) {
  const table = TableEnum.Master;
  const primaryKey = primaryKeys[table];

  function validateMasterData(data: any, isUpdate = false) {
    const validated: Record<string, any> = {};

    if (!isUpdate || 'name' in data) {
      const name = (data.name ?? '').trim();
      if (!name || name.length > 200) {
        throw new Error(ERRORS_MESSAGE.master.validate.name);
      }
      validated.name = name;
    }

    return validated;
  }

  ipcMain.handle('master:count', () => {
    const stmt = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`);
    return stmt.get().count;
  });

  ipcMain.handle('master:list', () => {
    const stmt = database.prepare(`SELECT * FROM ${table}`);
    return stmt.all();
  });

  ipcMain.handle('master:details', (_, masterId) => {
    const stmt = database.prepare(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`);
    const master = stmt.get(masterId);
    if (!master) {
      throw new Error(ERRORS_MESSAGE.master.handlers.details.default);
    }
    return master;
  });

  ipcMain.handle('master:create', (_, data) => {
    const resolvedData = validateMasterData(data);
    const fields = Object.keys(resolvedData);
    const placeholders = fields.map(() => '?').join(', ');
    const stmt = database.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    );
    const result = stmt.run(...fields.map((field) => resolvedData[field]));
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.master.handlers.create.default);
    }
    return { success: true };
  });

  ipcMain.handle('master:update', (_, { id, data }) => {
    const resolvedData = validateMasterData(data, true);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.master.handlers.update.noNewData);
    }
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.master.handlers.update.default);
    }
    return { success: true };
  });

  ipcMain.handle('master:delete', (_, id) => {
    const transaction = database.transaction((masterId: number) => {
      const clearMasterRef = database.prepare(
        `UPDATE ${TableEnum.Work} SET ${primaryKey} = NULL WHERE ${primaryKey} = ?`,
      );
      clearMasterRef.run(masterId);
      const stmt = database.prepare(`DELETE FROM ${table} WHERE ${primaryKey} = ?`);
      const result = stmt.run(masterId);
      if (result.changes === 0) {
        throw new Error(ERRORS_MESSAGE.master.handlers.delete.noData);
      }
    });
    try {
      transaction(id);
      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error(ERRORS_MESSAGE.master.handlers.delete.default);
    }
  });
}
