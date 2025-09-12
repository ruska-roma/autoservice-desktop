import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initClientController(database) {
  const table = TableEnum.Client;
  const primaryKey = primaryKeys[table];
  const clientExactMatchFields = new Set([primaryKey]);

  function validateClientData(data: any, isUpdate = false) {
    const validated: Record<string, any> = {};

    if (!isUpdate || 'name' in data) {
      const name = (data.name ?? '').trim();
      if (!name || name.length > 200) {
        throw new Error(ERRORS_MESSAGE.client.validate.name);
      }
      validated.name = name;
    }

    if (!isUpdate || 'phone' in data) {
      const phone = (data.phone ?? '').trim();
      if (!phone || phone.length > 50) {
        throw new Error(ERRORS_MESSAGE.client.validate.phone);
      }
      validated.phone = phone;
    }

    if (!isUpdate || 'address' in data) {
      const address = (data.address ?? '').trim();
      if (address.length > 200) {
        throw new Error(ERRORS_MESSAGE.client.validate.address);
      }
      validated.address = address;
    }

    if (!isUpdate || 'info' in data) {
      const info = (data.info ?? '').trim();
      if (info.length > 200) {
        throw new Error(ERRORS_MESSAGE.client.validate.info);
      }
      validated.info = info;
    }

    return validated;
  }

  ipcMain.handle('client:count', () => {
    const stmt = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`);
    return stmt.get().count;
  });

  ipcMain.handle('client:list', (_, { limit, offset }) => {
    const stmt = database.prepare(
      `SELECT * FROM ${table} ORDER BY ${primaryKey} DESC LIMIT ? OFFSET ?`,
    );
    return stmt.all(limit, offset);
  });

  ipcMain.handle('client:details', (_, clientId) => {
    const clientStmt = database.prepare(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`);
    const client = clientStmt.get(clientId);
    if (!client) {
      throw new Error(ERRORS_MESSAGE.client.handlers.details.default);
    }

    const autosStmt = database.prepare(`SELECT * FROM ${TableEnum.Auto} WHERE ${primaryKey} = ?`);
    const autos = autosStmt.all(clientId);

    let accounts = [];
    if (autos.length > 0) {
      const autoIds = autos.map((auto) => auto[primaryKeys[TableEnum.Auto]]);
      const placeholders = autoIds.map(() => '?').join(', ');
      const accountsStmt = database.prepare(
        `SELECT * FROM ${TableEnum.Account} WHERE ${primaryKeys[TableEnum.Auto]} IN (${placeholders}) ORDER BY date DESC`,
      );
      accounts = accountsStmt.all(...autoIds);
    }

    return { ...client, autos, accounts };
  });

  ipcMain.handle('client:create', (_, data) => {
    const resolvedData = validateClientData(data);

    const checkDuplicateStmt = database.prepare(`SELECT 1 FROM ${table} WHERE phone = ? LIMIT 1`);
    const isDuplicate = checkDuplicateStmt.get(resolvedData.phone);
    if (isDuplicate) {
      throw new Error(ERRORS_MESSAGE.client.handlers.create.hasDuplicate);
    }

    const fields = Object.keys(resolvedData);
    const placeholders = fields.map(() => '?').join(', ');
    const stmt = database.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    );
    const result = stmt.run(...fields.map((field) => resolvedData[field]));
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.client.handlers.create.default);
    }
    return { id_client: result.lastInsertRowid as number };
  });

  ipcMain.handle('client:update', (_, { id, data }) => {
    const resolvedData = validateClientData(data, true);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.client.handlers.update.noNewData);
    }
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.client.handlers.update.default);
    }
    return { success: true };
  });

  ipcMain.handle('client:delete', (_, clientId) => {
    const transaction = database.transaction((id) => {
      const deleteParts = database.prepare(`
        DELETE FROM ${TableEnum.Part} WHERE ${primaryKeys[TableEnum.Work]} IN (
          SELECT ${primaryKeys[TableEnum.Work]} FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} IN (
            SELECT ${primaryKeys[TableEnum.Account]} FROM ${TableEnum.Account} WHERE ${primaryKeys[TableEnum.Auto]} IN (
              SELECT ${primaryKeys[TableEnum.Auto]} FROM ${TableEnum.Auto} WHERE ${primaryKey} = ?
            )
          )
        )
      `);
      const deleteWorks = database.prepare(`
        DELETE FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} IN (
          SELECT ${primaryKeys[TableEnum.Account]} FROM ${TableEnum.Account} WHERE ${primaryKeys[TableEnum.Auto]} IN (
            SELECT ${primaryKeys[TableEnum.Auto]} FROM ${TableEnum.Auto} WHERE ${primaryKey} = ?
          )
        )
      `);
      const deleteAccounts = database.prepare(`
        DELETE FROM ${TableEnum.Account} WHERE ${primaryKeys[TableEnum.Auto]} IN (
          SELECT ${primaryKeys[TableEnum.Auto]} FROM ${TableEnum.Auto} WHERE ${primaryKey} = ?
        )
      `);
      const deleteAutos = database.prepare(`DELETE FROM ${TableEnum.Auto} WHERE ${primaryKey} = ?`);
      const deleteClient = database.prepare(`DELETE FROM ${table} WHERE ${primaryKey} = ?`);

      deleteParts.run(id);
      deleteWorks.run(id);
      deleteAccounts.run(id);
      deleteAutos.run(id);

      const result = deleteClient.run(id);
      if (result.changes === 0) {
        throw new Error(ERRORS_MESSAGE.client.handlers.delete.noData);
      }
    });

    try {
      transaction(clientId);
      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error(ERRORS_MESSAGE.client.handlers.delete.default);
    }
  });

  ipcMain.handle('client:search', (_, { field, query, limit, offset }) => {
    const isExact = clientExactMatchFields.has(field);
    const stmt = database.prepare(
      `SELECT * FROM ${table} WHERE ${field} ${isExact ? '= ?' : 'LIKE ?'} ORDER BY ${primaryKey} DESC LIMIT ? OFFSET ?`,
    );
    const value = isExact ? query : `%${query}%`;
    return stmt.all(value, limit, offset);
  });

  ipcMain.handle('client:search-count', (_, { field, query }) => {
    const isExact = clientExactMatchFields.has(field);
    const stmt = database.prepare(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${field} ${isExact ? '= ?' : 'LIKE ?'}`,
    );
    const value = isExact ? query : `%${query}%`;
    return stmt.get(value).count;
  });
}
