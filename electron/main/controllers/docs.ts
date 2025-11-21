import * as docx from 'docx';
import { dialog, ipcMain } from 'electron';
import fs from 'fs';

import { primaryKeys, TableEnum } from '../config';
import { formatDateToRu } from '../lib';

export function initDocsController(database) {
  function formatAutoTitle(autoData: { brand?: string | null; model?: string | null }): string {
    if (!autoData) {
      return '';
    }

    const { brand, model } = autoData;

    const resolvedBrand = brand?.trim() || '';
    const resolvedModel = model?.trim() || '';

    return [resolvedBrand, resolvedModel].filter(Boolean).join(' ');
  }

  function formatWorksTotal(works: Array<{ total_work_cost?: number }>): string {
    if (!Array.isArray(works) || works.length === 0) {
      return '0.00';
    }

    const total = works.reduce((sum, work) => {
      const value = Number(work.total_work_cost) || 0;
      return sum + value;
    }, 0);

    return total.toFixed(2);
  }

  function formatPartsTotal(parts: Array<{ total_part_cost?: number }>): string {
    if (!Array.isArray(parts) || parts.length === 0) {
      return '0.00';
    }

    const total = parts.reduce((sum, part) => {
      const value = Number(part.total_part_cost) || 0;
      return sum + value;
    }, 0);

    return total.toFixed(2);
  }

  function formatAccountTotal(
    works: Array<{ total_work_cost?: number }>,
    parts: Array<{ total_part_cost?: number }>,
  ): string {
    const worksTotal = Array.isArray(works)
      ? works.reduce((sum, w) => sum + (Number(w.total_work_cost) || 0), 0)
      : 0;
    const partsTotal = Array.isArray(parts)
      ? parts.reduce((sum, p) => sum + (Number(p.total_part_cost) || 0), 0)
      : 0;
    return (worksTotal + partsTotal).toFixed(2);
  }

  function countAccountPositions(works: Array<any>, parts: Array<any>): number {
    const worksCount = Array.isArray(works) ? works.length : 0;
    const partsCount = Array.isArray(parts) ? parts.length : 0;
    return worksCount + partsCount;
  }

  function getCompany() {
    const COMPANY_ID = 1;

    const stmt = database.prepare(
      `SELECT * FROM ${TableEnum.Company} WHERE ${primaryKeys[TableEnum.Company]} = ?`,
    );
    return stmt.get(COMPANY_ID);
  }

  function getAccount(accountId: number) {
    const stmt = database.prepare(
      `SELECT * FROM ${TableEnum.Account} WHERE ${primaryKeys[TableEnum.Account]} = ?`,
    );
    return stmt.get(accountId);
  }

  function getWorks(accountId: number) {
    const stmt = database.prepare(
      `SELECT * FROM ${TableEnum.Work} WHERE ${primaryKeys[TableEnum.Account]} = ? ORDER BY ${primaryKeys[TableEnum.Work]} DESC`,
    );
    const data = stmt.all(accountId);

    return data.map((item) => {
      const cost = Number(item.work_cost) || 0;
      const hours = Number(item.work_hours) || 0;
      const discount = Number(item.discount) || 0;

      const total_work_cost = cost * hours * (1 - discount);

      return {
        ...item,
        description: item.description ? String(item.description).toUpperCase() : '',
        work_cost: cost.toFixed(2),
        total_work_cost: total_work_cost.toFixed(2),
        discount_display: discount === 0 ? '0%' : `${(discount * 100).toFixed(0)}%`,
      };
    });
  }

  function getParts(works: Array<any>) {
    if (works.length === 0) {
      return [];
    }

    const workIds = works.map((work) => work[primaryKeys[TableEnum.Work]]);
    const placeholders = workIds.map(() => '?').join(', ');

    const stmt = database.prepare(
      `SELECT * FROM ${TableEnum.Part} WHERE ${primaryKeys[TableEnum.Work]} IN (${placeholders}) ORDER BY ${primaryKeys[TableEnum.Part]} DESC`,
    );
    const data = stmt.all(...workIds);

    return data.map((item) => {
      const cost = Number(item.part_cost) || 0;
      const count = Number(item.part_count) || 0;
      const discount = Number(item.discount) || 0;

      const total_part_cost = cost * count * (1 - discount);

      return {
        ...item,
        description: item.description ? String(item.description).toUpperCase() : '',
        part_cost: cost.toFixed(2),
        total_part_cost: total_part_cost.toFixed(2),
        discount_display: discount === 0 ? '0%' : `${(discount * 100).toFixed(0)}%`,
      };
    });
  }

  function getClient(accountId: number) {
    const stmt = database.prepare(
      `SELECT c.* 
       FROM ${TableEnum.Account} a
       JOIN ${TableEnum.Auto} au
         ON au.${primaryKeys[TableEnum.Auto]} = a.${primaryKeys[TableEnum.Auto]}
       JOIN ${TableEnum.Client} c
         ON c.${primaryKeys[TableEnum.Client]} = au.${primaryKeys[TableEnum.Client]}
       WHERE a.${primaryKeys[TableEnum.Account]} = ?`,
    );
    return stmt.get(accountId);
  }

  function getAuto(autoId: number) {
    const stmt = database.prepare(
      `SELECT * FROM ${TableEnum.Auto} WHERE ${primaryKeys[TableEnum.Auto]} = ?`,
    );
    return stmt.get(autoId);
  }

  ipcMain.handle('docs:order', async (_, accountId) => {
    // Get company
    const companyData = getCompany();
    if (!companyData?.short_name || !companyData?.address) {
      throw new Error('Данные компании отсутствуют');
    }

    // Get account
    const accountData = getAccount(accountId);
    if (!accountData?.legal_number || !accountData?.date) {
      throw new Error('Данные счета отсутствуют');
    }

    // Get client
    const clientData = getClient(accountId);
    if (!clientData?.name || !clientData?.phone) {
      throw new Error('Данные клиента отсутствуют');
    }

    // Get auto
    const autoData = getAuto(accountData.id_auto);
    if (!autoData?.vin || !autoData?.plate_number) {
      throw new Error('Данные авто отсутствуют');
    }

    // Get works
    const worksData = getWorks(accountId);
    if (!worksData || worksData.length === 0) {
      throw new Error('Данные работ отсутствуют');
    }

    // Get parts
    const partsData = getParts(worksData);

    // Generate doc layout
    const headerTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      borders: docx.TableBorders.NONE,
      columnWidths: [5000, 5000],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: companyData.short_name })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: companyData.address })],
                  alignment: docx.AlignmentType.RIGHT,
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const title = new docx.Paragraph({
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 300, after: 300 },
      children: [
        new docx.TextRun({
          text: `Заказ-наряд № ${accountData.legal_number} от ${formatDateToRu(accountData.date)}`,
          size: 36,
          bold: true,
        }),
      ],
    });

    const clientTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      columnWidths: [5000],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: 'Заказчик: ', italics: true }),
                    new docx.TextRun({ text: clientData?.name ?? '' }),
                  ],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: 'Адрес: ', italics: true }),
                    new docx.TextRun({ text: clientData?.address ?? '' }),
                  ],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: 'Телефон: ', italics: true }),
                    new docx.TextRun({ text: clientData?.phone ?? '' }),
                  ],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Плательщик:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const adminTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      columnWidths: [5000],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Заказ принял:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Расчёт:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Дата закрытия:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Заказ закрыл:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const clientAdminWrapperTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      margins: { bottom: 283 },
      borders: docx.TableBorders.NONE,
      columnWidths: [4500, 4500],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              width: { size: 4500, type: docx.WidthType.DXA },
              margins: { right: 283 },
              children: [clientTable],
            }),
            new docx.TableCell({
              width: { size: 4500, type: docx.WidthType.DXA },
              children: [adminTable],
            }),
          ],
        }),
      ],
    });

    const autoTableMain = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      columnWidths: [5000],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: 'Марка и модель ТС: ', italics: true }),
                    new docx.TextRun({ text: formatAutoTitle(autoData) }),
                  ],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: 'VIN: ', italics: true }),
                    new docx.TextRun({ text: autoData?.vin ?? '' }),
                  ],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Кузов №:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Двигатель №:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Тип кузова:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const autoTableSecondary = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      columnWidths: [5000],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({ text: 'Гос номер: ', italics: true }),
                    new docx.TextRun({ text: autoData?.plate_number ?? '' }),
                  ],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Техпаспорт:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Год выпуска:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Пробег:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [new docx.TextRun({ text: 'Цвет:', italics: true })],
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const autoWrapperTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      margins: { bottom: 283 },
      borders: docx.TableBorders.NONE,
      columnWidths: [4500, 4500],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              width: { size: 4500, type: docx.WidthType.DXA },
              margins: { right: 283 },
              children: [autoTableMain],
            }),
            new docx.TableCell({
              width: { size: 4500, type: docx.WidthType.DXA },
              children: [autoTableSecondary],
            }),
          ],
        }),
      ],
    });

    const reasonLabel = new docx.Paragraph({
      alignment: docx.AlignmentType.LEFT,
      spacing: { after: 50 },
      children: [
        new docx.TextRun({
          text: 'Причина обращения:',
          italics: true,
        }),
      ],
    });
    const underlineRow = new docx.Table({
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      borders: docx.TableBorders.NONE,
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              borders: {
                bottom: {
                  style: docx.BorderStyle.SINGLE,
                  size: 1,
                  color: '000000',
                },
              },
              children: [new docx.Paragraph('')],
            }),
          ],
        }),
      ],
    });
    const reasonWrapper = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      borders: docx.TableBorders.NONE,
      margins: { bottom: 283 },
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              borders: docx.TableBorders.NONE,
              children: [reasonLabel, underlineRow],
            }),
          ],
        }),
      ],
    });

    const worksTitle = new docx.Paragraph({
      alignment: docx.AlignmentType.LEFT,
      spacing: { after: 150 },
      children: [
        new docx.TextRun({
          text: 'Перечень выполненных работ:',
          size: 28,
          bold: true,
        }),
      ],
    });
    const worksTableHeader = new docx.TableRow({
      tableHeader: true,
      children: [
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: '№', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Код', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Наименование работ, услуг', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Ед. изм.', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Кол-во', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Цена', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Скидка', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Сумма', bold: true })],
            }),
          ],
        }),
      ],
    });
    const worksTableContent = worksData.map((work, index) => {
      return new docx.TableRow({
        children: [
          new docx.TableCell({
            children: [
              new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, text: String(index + 1) }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: String(work?.id_work) ?? '',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                text: work?.description ?? '',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: 'шт.',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: String(work?.work_hours ?? ''),
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                text: String(work?.work_cost ?? ''),
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: work?.discount_display ?? '',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                text: String(work?.total_work_cost ?? ''),
              }),
            ],
          }),
        ],
      });
    });
    const worksTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      columnWidths: [500, 1000, 4000, 750, 750, 1000, 1000, 1000],
      rows: [worksTableHeader, ...worksTableContent],
    });
    const worksTotal = new docx.Paragraph({
      alignment: docx.AlignmentType.RIGHT,
      spacing: { before: 200, after: 200 },
      children: [
        new docx.TextRun({
          text: 'Итого: ',
        }),
        new docx.TextRun({
          text: formatWorksTotal(worksData),
          border: {
            style: docx.BorderStyle.SINGLE,
            size: 1,
            color: '000000',
          },
        }),
      ],
    });

    const partsTitle = new docx.Paragraph({
      alignment: docx.AlignmentType.LEFT,
      spacing: { after: 150 },
      children: [
        new docx.TextRun({
          text: 'Перечень используемых материалов:',
          size: 28,
          bold: true,
        }),
      ],
    });
    const partsTableHeader = new docx.TableRow({
      tableHeader: true,
      children: [
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: '№', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Код', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Наименование товара, запчасти', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Ед. изм.', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Кол-во', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Цена', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Скидка', bold: true })],
            }),
          ],
        }),
        new docx.TableCell({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [new docx.TextRun({ text: 'Сумма', bold: true })],
            }),
          ],
        }),
      ],
    });
    const partsTableContent = partsData.map((part, index) => {
      return new docx.TableRow({
        children: [
          new docx.TableCell({
            children: [
              new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, text: String(index + 1) }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: String(part?.id_part) ?? '',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.LEFT,
                text: part?.description ?? '',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: part?.part_unit ?? 'шт.',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: String(part?.part_count ?? ''),
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                text: String(part?.part_cost ?? ''),
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                text: part?.discount_display ?? '',
              }),
            ],
          }),
          new docx.TableCell({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                text: String(part?.total_part_cost ?? ''),
              }),
            ],
          }),
        ],
      });
    });
    const partsTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      columnWidths: [500, 1000, 4000, 750, 750, 1000, 1000, 1000],
      rows: [partsTableHeader, ...partsTableContent],
    });
    const partsTotal = new docx.Paragraph({
      alignment: docx.AlignmentType.RIGHT,
      spacing: { before: 200, after: 200 },
      children: [
        new docx.TextRun({
          text: 'Итого: ',
        }),
        new docx.TextRun({
          text: formatPartsTotal(partsData),
          border: {
            style: docx.BorderStyle.SINGLE,
            size: 1,
            color: '000000',
          },
        }),
      ],
    });

    const accountTotal = new docx.Paragraph({
      alignment: docx.AlignmentType.RIGHT,
      children: [
        new docx.TextRun({
          text: 'Всего к оплате: ',
          bold: true,
        }),
        new docx.TextRun({
          text: formatAccountTotal(worksData, partsData),
          bold: true,
          border: {
            style: docx.BorderStyle.SINGLE,
            size: 1,
            color: '000000',
          },
        }),
      ],
    });
    const accountTotalLabel = new docx.Paragraph({
      alignment: docx.AlignmentType.LEFT,
      spacing: { before: 100, after: 50 },
      children: [
        new docx.TextRun({
          text: `Всего наименований ${countAccountPositions(worksData, partsData)} на сумму ${formatAccountTotal(worksData, partsData)} RUB`,
        }),
      ],
    });
    const accountAgreement = new docx.Paragraph({
      alignment: docx.AlignmentType.LEFT,
      spacing: { before: 50, after: 50 },
      children: [
        new docx.TextRun({
          text: '* Подписывая настоящий заказ-наряд, заказчик подтверждает выполнение работ в полном объёме, отсутствие претензий по качеству выполненных работ и использованных материалов, а также согласие с указанной стоимостью.',
        }),
      ],
    });
    const footerWrapper = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      borders: docx.TableBorders.NONE,
      margins: { bottom: 283 },
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              borders: docx.TableBorders.NONE,
              children: [accountTotalLabel, underlineRow, accountAgreement],
            }),
          ],
        }),
      ],
    });

    const clientLabel = new docx.Paragraph({
      spacing: { after: 300 },
      children: [new docx.TextRun({ text: 'От заказчика:', bold: true })],
    });
    const signTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      borders: docx.TableBorders.NONE,
      columnWidths: [5000, 5000],
      rows: [
        new docx.TableRow({
          children: [
            new docx.TableCell({
              borders: docx.TableBorders.NONE,
              children: [
                new docx.Paragraph({
                  text: 'фамилия, имя, отчество',
                  alignment: docx.AlignmentType.LEFT,
                }),
              ],
            }),
            new docx.TableCell({
              borders: docx.TableBorders.NONE,
              children: [
                new docx.Paragraph({ text: 'подпись', alignment: docx.AlignmentType.RIGHT }),
              ],
            }),
          ],
        }),
      ],
    });
    const clientFooterColumn = new docx.TableCell({
      borders: docx.TableBorders.NONE,
      children: [clientLabel, underlineRow, signTable],
    });
    const footerTable = new docx.Table({
      layout: docx.TableLayoutType.FIXED,
      width: { size: 100, type: docx.WidthType.PERCENTAGE },
      borders: docx.TableBorders.NONE,
      columnWidths: [5000, 5000],
      rows: [
        new docx.TableRow({
          children: [
            clientFooterColumn,
            new docx.TableCell({
              borders: docx.TableBorders.NONE,
              children: [new docx.Paragraph('')],
            }),
          ],
        }),
      ],
    });

    // Generate document
    const documentChildren: (docx.Paragraph | docx.Table)[] = [
      headerTable,
      title,
      clientAdminWrapperTable,
      autoWrapperTable,
      reasonWrapper,
      worksTitle,
      worksTable,
      worksTotal,
    ];

    if (partsData.length > 0) {
      documentChildren.push(partsTitle, partsTable, partsTotal);
    }

    documentChildren.push(accountTotal, footerWrapper, footerTable);

    const document = new docx.Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Times New Roman',
              size: 20,
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 283,
                bottom: 283,
                left: 283,
                right: 283,
              },
            },
          },
          children: documentChildren,
        },
      ],
    });

    // Save doc
    const fileName = `Заказ-наряд_${accountData.legal_number}_${accountData.date}.docx`;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Сохранить заказ-наряд',
      defaultPath: fileName,
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
    });

    if (canceled || !filePath) {
      throw new Error('Сохранение документа отклонено');
    }

    const buffer = await docx.Packer.toBuffer(document);
    fs.writeFileSync(filePath, buffer);
  });
}
