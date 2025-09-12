import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initWorkController(database) {
  const table = TableEnum.Work;
  const primaryKey = primaryKeys[table];

  function validateWorkData(data: any, isUpdate = false) {
    const validated: Record<string, any> = {};

    if (!isUpdate || 'id_account' in data) {
      const idAccount = Number(data.id_account);
      if (!Number.isFinite(idAccount) || idAccount <= 0) {
        throw new Error(ERRORS_MESSAGE.work.validate.id_account);
      }
      validated.id_account = idAccount;
    }

    if (!isUpdate || 'id_master' in data) {
      if (data.id_master != null) {
        const idMaster = Number(data.id_master);
        if (!Number.isFinite(idMaster) || idMaster <= 0) {
          throw new Error(ERRORS_MESSAGE.work.validate.id_master);
        }
        validated.id_master = idMaster;
      } else {
        validated.id_master = null;
      }
    }

    if (!isUpdate || 'date' in data) {
      const date = (data.date ?? '').toString().trim();
      if (!date) {
        throw new Error(ERRORS_MESSAGE.work.validate.date);
      }
      validated.date = date;
    }

    if (!isUpdate || 'work_cost' in data) {
      const cost = Number(data.work_cost);
      if (!Number.isFinite(cost)) {
        throw new Error(ERRORS_MESSAGE.work.validate.work_cost);
      }
      validated.work_cost = cost;
    }

    if (!isUpdate || 'work_hours' in data) {
      const hours = Number(data.work_hours);
      if (!Number.isFinite(hours) || hours < 0) {
        throw new Error(ERRORS_MESSAGE.work.validate.work_hours);
      }
      validated.work_hours = hours;
    }

    if (!isUpdate || 'discount' in data) {
      const discount = Number(data.discount);
      if (!Number.isFinite(discount)) {
        throw new Error(ERRORS_MESSAGE.work.validate.discount);
      }
      validated.discount = discount;
    }

    if (!isUpdate || 'description' in data) {
      const desc = (data.description ?? '').toString().trim();
      if (desc.length > 200) {
        throw new Error(ERRORS_MESSAGE.work.validate.description);
      }
      validated.description = desc || 'Без названия';
    }

    return validated;
  }

  ipcMain.handle('work:create', (_, data) => {
    const resolvedData = validateWorkData(data);

    const fields = Object.keys(resolvedData);
    const placeholders = fields.map(() => '?').join(', ');
    const stmt = database.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    );

    const result = stmt.run(...fields.map((field) => resolvedData[field]));
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.work.handlers.create.default);
    }
    return { id_work: result.lastInsertRowid as number };
  });

  ipcMain.handle('work:update', (_, { id, data }) => {
    const resolvedData = validateWorkData(data, true);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.work.handlers.update.noNewData);
    }
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.work.handlers.update.default);
    }
    return { success: true };
  });

  ipcMain.handle('work:delete', (_, id) => {
    const transaction = database.transaction((id: number) => {
      const deleteParts = database.prepare(
        `DELETE FROM ${TableEnum.Part} WHERE ${primaryKeys[TableEnum.Work]} = ?`,
      );
      const deleteWork = database.prepare(`DELETE FROM ${table} WHERE ${primaryKey} = ?`);

      deleteParts.run(id);
      const result = deleteWork.run(id);
      if (result.changes === 0) {
        throw new Error(ERRORS_MESSAGE.work.handlers.delete.noData);
      }
    });

    try {
      transaction(id);
      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error(ERRORS_MESSAGE.work.handlers.delete.default);
    }
  });
}
