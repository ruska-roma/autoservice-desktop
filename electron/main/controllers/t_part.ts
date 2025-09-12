import { ipcMain } from 'electron';

import { ERRORS_MESSAGE, primaryKeys, TableEnum } from '../config';

export function initPartController(database) {
  const table = TableEnum.Part;
  const primaryKey = primaryKeys[table];

  function validatePartData(data: any, isUpdate = false) {
    const validated: Record<string, any> = {};

    if (!isUpdate || 'id_work' in data) {
      const idWork = Number(data.id_work);
      if (!Number.isFinite(idWork) || idWork <= 0) {
        throw new Error(ERRORS_MESSAGE.part.validate.id_work);
      }
      validated.id_work = idWork;
    }

    if (!isUpdate || 'description' in data) {
      const desc = (data.description ?? '').toString().trim();
      if (desc.length > 200) {
        throw new Error(ERRORS_MESSAGE.part.validate.description);
      }
      validated.description = desc || 'Без названия';
    }

    if (!isUpdate || 'part_unit' in data) {
      const unit = (data.part_unit ?? '').toString().trim();
      if (unit.length > 10) {
        throw new Error(ERRORS_MESSAGE.part.validate.part_unit);
      }
      validated.part_unit = unit || null;
    }

    if (!isUpdate || 'part_count' in data) {
      const count = Number(data.part_count);
      if (!Number.isFinite(count) || count < 0) {
        throw new Error(ERRORS_MESSAGE.part.validate.part_count);
      }
      validated.part_count = count;
    }

    if (!isUpdate || 'part_cost' in data) {
      const cost = Number(data.part_cost);
      if (!Number.isFinite(cost)) {
        throw new Error(ERRORS_MESSAGE.part.validate.part_cost);
      }
      validated.part_cost = cost;
    }

    if (!isUpdate || 'discount' in data) {
      const discount = Number(data.discount);
      if (!Number.isFinite(discount)) {
        throw new Error(ERRORS_MESSAGE.part.validate.discount);
      }
      validated.discount = discount;
    }

    return validated;
  }

  ipcMain.handle('part:create', (_, data) => {
    const resolvedData = validatePartData(data);

    const fields = Object.keys(resolvedData);
    const placeholders = fields.map(() => '?').join(', ');
    const stmt = database.prepare(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
    );

    const result = stmt.run(...fields.map((field) => resolvedData[field]));
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.part.handlers.create.default);
    }
    return { id_part: result.lastInsertRowid as number };
  });

  ipcMain.handle('part:update', (_, { id, data }) => {
    const resolvedData = validatePartData(data, true);
    const fields = Object.keys(resolvedData);
    if (fields.length === 0) {
      throw new Error(ERRORS_MESSAGE.part.handlers.update.noNewData);
    }
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const stmt = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = ?`);
    const result = stmt.run(...fields.map((f) => resolvedData[f]), id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.part.handlers.update.default);
    }
    return { success: true };
  });

  ipcMain.handle('part:delete', (_, id) => {
    const stmt = database.prepare(`DELETE FROM ${table} WHERE ${primaryKey} = ?`);
    const result = stmt.run(id);
    if (result.changes === 0) {
      throw new Error(ERRORS_MESSAGE.part.handlers.delete.default);
    }
    return { success: true };
  });
}
