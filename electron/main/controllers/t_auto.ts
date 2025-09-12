import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initAutoController(database) {
  const table = TableEnum.Auto;
  const primaryKey = primaryKeys[table];
  const autoExactMatchFields = new Set([primaryKey]);

  function validateAutoData(data: any, isUpdate = false) {
    const validated: Record<string, any> = {};

    if (!isUpdate || 'id_client' in data) {
      const idClient = Number(data.id_client);
      if (!Number.isFinite(idClient) || idClient <= 0) {
        throw new Error(ERRORS_MESSAGE.auto.validate.id_client);
      }
      validated.id_client = idClient;
    }

    if (!isUpdate || 'vin' in data) {
      const vin = (data.vin ?? '').toString().trim();
      if (!vin || vin.length > 30) {
        throw new Error(ERRORS_MESSAGE.auto.validate.vin);
      }
      validated.vin = vin;
    }

    if (!isUpdate || 'brand' in data) {
      const brand = (data.brand ?? '').toString().trim();
      if (brand.length > 50) {
        throw new Error(ERRORS_MESSAGE.auto.validate.brand);
      }
      validated.brand = brand;
    }

    if (!isUpdate || 'model' in data) {
      const model = (data.model ?? '').toString().trim();
      if (model.length > 50) {
        throw new Error(ERRORS_MESSAGE.auto.validate.model);
      }
      validated.model = model;
    }

    if (!isUpdate || 'plate_number' in data) {
      const plate = (data.plate_number ?? '').toString().trim();
      if (!plate || plate.length > 20) {
        throw new Error(ERRORS_MESSAGE.auto.validate.plate_number);
      }
      validated.plate_number = plate;
    }

    return validated;
  }

  ipcMain.handle('auto:count', () => {
    const stmt = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`);
    return stmt.get().count;
  });

  ipcMain.handle('auto:list', (_, { limit, offset }) => {
    const stmt = database.prepare(
      `SELECT a.*, c.name AS client_name FROM ${table} a JOIN ${TableEnum.Client} c ON c.${primaryKeys[TableEnum.Client]} = a.${primaryKeys[TableEnum.Client]} ORDER BY a.${primaryKey} DESC LIMIT ? OFFSET ?`,
    );
    const rows = stmt.all(limit, offset);
    return rows.map((r: any) => {
      const { client_name, ...auto } = r;
      return {
        ...auto,
        client_name,
      };
    });
  });

  ipcMain.handle('auto:details', (_, autoId) => {
    const stmt = database.prepare(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`);
    const auto = stmt.get(autoId);
    if (!auto) {
      throw new Error(ERRORS_MESSAGE.auto.handlers.details.default);
    }
    return auto;
  });

  ipcMain.handle('auto:create', (_, data) => {
    const resolved = validateAutoData(data);

    const checkDuplicateStmt = database.prepare(`SELECT 1 FROM ${table} WHERE vin = ? LIMIT 1`);
    const isDuplicate = checkDuplicateStmt.get(resolved.vin);
    if (isDuplicate) {
      throw new Error(ERRORS_MESSAGE.auto.handlers.create.hasDuplicate);
    }

    const fields = Object.keys(resolved);
    const placeholders = fields.map(() => '?').join(', ');
    const stmt = database.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    );
    const result = stmt.run(...fields.map((f) => resolved[f]));
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.auto.handlers.create.default);
    }
    return { success: true };
  });

  ipcMain.handle('auto:update', (_, { id, data }) => {
    const resolvedData = validateAutoData(data, true);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.auto.handlers.update.noNewData);
    }
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.auto.handlers.update.default);
    }
    return { success: true };
  });

  ipcMain.handle('auto:delete', (_, autoId) => {
    const transaction = database.transaction((id: number) => {
      const deleteParts = database.prepare(`
        DELETE FROM ${TableEnum.Part} WHERE ${primaryKeys[TableEnum.Work]} IN (
          SELECT ${primaryKeys[TableEnum.Work]} FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} IN (
            SELECT ${primaryKeys[TableEnum.Account]} FROM ${TableEnum.Account}
            WHERE ${primaryKeys[TableEnum.Auto]} = ?
          )
        )
      `);

      const deleteWorks = database.prepare(`
        DELETE FROM ${TableEnum.Work}
        WHERE ${primaryKeys[TableEnum.Account]} IN (
          SELECT ${primaryKeys[TableEnum.Account]} FROM ${TableEnum.Account}
          WHERE ${primaryKeys[TableEnum.Auto]} = ?
        )
      `);

      const deleteAccounts = database.prepare(`
        DELETE FROM ${TableEnum.Account}
        WHERE ${primaryKeys[TableEnum.Auto]} = ?
      `);

      const deleteAuto = database.prepare(`DELETE FROM ${table} WHERE ${primaryKey} = ?`);

      deleteParts.run(id);
      deleteWorks.run(id);
      deleteAccounts.run(id);

      const res = deleteAuto.run(id);
      if (res.changes === 0) {
        throw new Error(ERRORS_MESSAGE.auto.handlers.delete.noData);
      }
    });

    try {
      transaction(autoId);
      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error(ERRORS_MESSAGE.auto.handlers.delete.default);
    }
  });

  ipcMain.handle('auto:search', (_, { field, query, limit, offset }) => {
    const isExact = autoExactMatchFields.has(field);
    const stmt = database.prepare(
      `SELECT a.*, c.name AS client_name
       FROM ${table} a
       JOIN ${TableEnum.Client} c
         ON c.${primaryKeys[TableEnum.Client]} = a.${primaryKeys[TableEnum.Client]}
         WHERE ${isExact ? `a.${field} = ?` : `normalize(a.${field}) LIKE normalize(?)`}
       ORDER BY a.${primaryKey} DESC
       LIMIT ? OFFSET ?`,
    );

    const value = isExact ? query : `%${query}%`;
    const rows = stmt.all(value, limit, offset);

    return rows.map((r: any) => {
      const { client_name, ...auto } = r;
      return {
        ...auto,
        client_name,
      };
    });
  });

  ipcMain.handle('auto:search-count', (_, { field, query }) => {
    const isExact = autoExactMatchFields.has(field);
    const stmt = database.prepare(
      `SELECT COUNT(*) as count 
       FROM ${table} 
       WHERE ${isExact ? `${field} = ?` : `normalize(${field}) LIKE normalize(?)`}`,
    );
    const value = isExact ? query : `%${query}%`;
    return stmt.get(value).count;
  });
}
