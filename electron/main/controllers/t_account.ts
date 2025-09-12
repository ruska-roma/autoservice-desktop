import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initAccountController(database) {
  const table = TableEnum.Account;
  const primaryKey = primaryKeys[table];
  const accountExactMatchFields = new Set([primaryKey]);

  function validateAccountData(data: any, isUpdate = false) {
    const validated: Record<string, any> = {};

    if (!isUpdate || 'date' in data) {
      const date = (data.date ?? '').trim();
      if (!date) {
        throw new Error(ERRORS_MESSAGE.account.validate.date);
      }
      validated.date = date;
    }

    if (!isUpdate || 'id_auto' in data) {
      const idAuto = Number(data.id_auto);
      if (!idAuto || isNaN(idAuto)) {
        throw new Error(ERRORS_MESSAGE.account.validate.id_auto);
      }
      validated.id_auto = idAuto;
    }

    if (!isUpdate || 'legal_number' in data) {
      const legalNumber = (data.legal_number ?? '').trim();
      if (!legalNumber || legalNumber.length > 200) {
        throw new Error(ERRORS_MESSAGE.account.validate.legal_number);
      }
      validated.legal_number = legalNumber;
    }

    if (!isUpdate || 'info' in data) {
      const info = (data.info ?? '').trim();
      if (info.length > 200) {
        throw new Error(ERRORS_MESSAGE.account.validate.info);
      }
      validated.info = info;
    }

    return validated;
  }

  ipcMain.handle('account:client', (_, accountId) => {
    const stmt = database.prepare(
      `SELECT c.* 
       FROM ${TableEnum.Account} a
       JOIN ${TableEnum.Auto} au
         ON au.${primaryKeys[TableEnum.Auto]} = a.${primaryKeys[TableEnum.Auto]}
       JOIN ${TableEnum.Client} c
         ON c.${primaryKeys[TableEnum.Client]} = au.${primaryKeys[TableEnum.Client]}
       WHERE a.${primaryKeys[TableEnum.Account]} = ?`,
    );

    const client = stmt.get(accountId);

    if (!client) {
      throw new Error(ERRORS_MESSAGE.account.handlers.client.default);
    }

    return client;
  });

  ipcMain.handle('account:count', () => {
    const stmt = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`);
    return stmt.get().count;
  });

  ipcMain.handle('account:list', (_, { limit, offset }) => {
    const stmt = database.prepare(
      `SELECT a.*, au.vin 
       FROM ${table} a 
       JOIN ${TableEnum.Auto} au 
         ON au.${primaryKeys[TableEnum.Auto]} = a.${primaryKeys[TableEnum.Auto]} 
       ORDER BY a.${primaryKey} DESC 
       LIMIT ? OFFSET ?`,
    );
    const rows = stmt.all(limit, offset);
    return rows.map((r: any) => {
      const { vin, ...account } = r;
      return {
        ...account,
        auto_vin: vin,
      };
    });
  });

  ipcMain.handle('account:details', (_, accountId) => {
    const accountStmt = database.prepare(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`);
    const account = accountStmt.get(accountId);
    if (!account) {
      throw new Error(ERRORS_MESSAGE.account.handlers.details.default);
    }

    const worksStmt = database.prepare(
      `SELECT * FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} = ? ORDER BY ${primaryKeys[TableEnum.Work]} DESC`,
    );
    const worksRaw = worksStmt.all(accountId);

    const masterStmt = database.prepare(
      `SELECT name FROM ${TableEnum.Master} WHERE ${primaryKeys[TableEnum.Master]} = ?`,
    );

    const works = worksRaw.map((work) => {
      const cost = Number(work.work_cost) || 0;
      const hours = Number(work.work_hours) || 0;
      const discount = Number(work.discount) || 0;

      const total_work_cost = cost * hours * (1 - discount);

      let master_name: string | null = null;
      if (work.id_master) {
        const master = masterStmt.get(work.id_master);
        master_name = master?.name ?? null;
      }

      return {
        ...work,
        master_name,
        total_work_cost,
        discount_display: discount === 0 ? null : `${(discount * 100).toFixed(0)}%`,
      };
    });

    let parts = [];
    if (works.length > 0) {
      const workIds = works.map((work) => work[primaryKeys[TableEnum.Work]]);
      const placeholders = workIds.map(() => '?').join(', ');

      const partsStmt = database.prepare(
        `SELECT * FROM ${TableEnum.Part} WHERE ${primaryKeys[TableEnum.Work]} IN (${placeholders}) ORDER BY ${primaryKeys[TableEnum.Part]} DESC`,
      );
      const partsRaw = partsStmt.all(...workIds);

      parts = partsRaw.map((part) => {
        const cost = Number(part.part_cost) || 0;
        const count = Number(part.part_count) || 0;
        const discount = Number(part.discount) || 0;

        const total_part_cost = cost * count * (1 - discount);

        return {
          ...part,
          total_part_cost,
          discount_display: discount === 0 ? null : `${(discount * 100).toFixed(0)}%`,
        };
      });
    }

    return { ...account, works, parts };
  });

  ipcMain.handle('account:create', (_, data) => {
    const resolvedData = validateAccountData(data);
    const fields = Object.keys(resolvedData);
    const placeholders = fields.map(() => '?').join(', ');
    const stmt = database.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    );
    const result = stmt.run(...fields.map((field) => resolvedData[field]));
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.account.handlers.create.default);
    }
    return { id_account: result.lastInsertRowid as number };
  });

  ipcMain.handle('account:update', (_, { id, data }) => {
    const resolvedData = validateAccountData(data, true);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.account.handlers.update.noNewData);
    }
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((field) => resolvedData[field]), id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.account.handlers.update.default);
    }
    return { success: true };
  });

  ipcMain.handle('account:delete', (_, accountId) => {
    const transaction = database.transaction((id) => {
      const deleteParts = database.prepare(
        `DELETE FROM ${TableEnum.Part} WHERE ${primaryKeys[TableEnum.Work]} IN (
          SELECT ${primaryKeys[TableEnum.Work]} FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} = ?
        )`,
      );
      const deleteWorks = database.prepare(
        `DELETE FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} = ?`,
      );
      const deleteAccount = database.prepare(`DELETE FROM ${table} WHERE ${primaryKey} = ?`);

      deleteParts.run(id);
      deleteWorks.run(id);

      const result = deleteAccount.run(id);
      if (result.changes === 0) {
        throw new Error(ERRORS_MESSAGE.account.handlers.delete.noData);
      }
    });

    try {
      transaction(accountId);
      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error(ERRORS_MESSAGE.account.handlers.delete.default);
    }
  });

  ipcMain.handle('account:search', (_, { field, query, limit, offset }) => {
    const isExact = accountExactMatchFields.has(field);
    const stmt = database.prepare(
      `SELECT a.*, au.vin
       FROM ${table} a
       JOIN ${TableEnum.Auto} au
         ON au.${primaryKeys[TableEnum.Auto]} = a.${primaryKeys[TableEnum.Auto]}
       WHERE a.${field} ${isExact ? '= ?' : 'LIKE ?'}
       ORDER BY a.${primaryKey} DESC
       LIMIT ? OFFSET ?`,
    );

    const value = isExact ? query : `%${query}%`;
    const rows = stmt.all(value, limit, offset);

    return rows.map((r: any) => {
      const { vin, ...account } = r;
      return {
        ...account,
        auto_vin: vin,
      };
    });
  });

  ipcMain.handle('account:search-count', (_, { field, query }) => {
    const isExact = accountExactMatchFields.has(field);
    const stmt = database.prepare(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${field} ${isExact ? '= ?' : 'LIKE ?'}`,
    );
    const value = isExact ? query : `%${query}%`;
    return stmt.get(value).count;
  });
}
