import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';

import {
  initAccountController,
  initAutoController,
  initClientController,
  initCompanyController,
  initMasterController,
  initPartController,
  initSettingsController,
  initWorkController,
} from './controllers';
import { initDatabase } from './database';
import { initAutoUpdater } from './modules';

let window: BrowserWindow | null;
let database: ReturnType<typeof initDatabase>;

function createWindow() {
  window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1440,
    minHeight: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // PROD
  // window.loadFile(path.resolve(__dirname, '../renderer/index.html'));

  // DEV
  window.loadURL('http://localhost:5173');

  window.on('closed', () => (window = null));
}

app.whenReady().then(() => {
  // Initialize modules
  initAutoUpdater();

  // Setup app settings
  Menu.setApplicationMenu(null);

  // Initialize Database
  database = initDatabase();

  // Initialize CRUD controllers
  initSettingsController(database);
  initClientController(database);
  initAutoController(database);
  initAccountController(database);
  initWorkController(database);
  initPartController(database);
  initMasterController(database);
  initCompanyController(database);

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (window == null) {
    createWindow();
  }
});
