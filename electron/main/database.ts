import Database from 'better-sqlite3';
import { app, dialog } from 'electron';
import Store from 'electron-store';
import fs from 'fs';

const store = new Store<{ databasePath: string }>();

function resolveDatabasePath() {
  let databasePath = store.get('databasePath');

  if (!databasePath || !fs.existsSync(databasePath)) {
    const result = dialog.showOpenDialogSync({
      title: 'Выберите файл базы данных',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
    });

    if (!result || result.length === 0) {
      console.error('Путь к базе данных не выбран');
      app.quit();
      process.exit(1);
    }

    databasePath = result[0];
    store.set('databasePath', databasePath);
  }

  return databasePath;
}

export function initDatabase() {
  const databasePath = resolveDatabasePath();
  const database = new Database(databasePath);

  database.exec(`PRAGMA foreign_keys = ON;`);

  database.function('normalize', (input: unknown) => {
    if (typeof input !== 'string') {
      return input;
    }
    return input.toLocaleLowerCase('ru-RU');
  });

  return database;
}
