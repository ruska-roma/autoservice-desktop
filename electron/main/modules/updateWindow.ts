import { BrowserWindow } from 'electron';
import path from 'path';

let updateWindow: BrowserWindow | null = null;

export function createUpdateWindow() {
  if (updateWindow) {
    return updateWindow;
  }

  updateWindow = new BrowserWindow({
    width: 400,
    height: 200,
    resizable: false,
    frame: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  updateWindow.loadFile(path.join(__dirname, '../renderer/update.html'));

  updateWindow.on('closed', () => {
    updateWindow = null;
  });

  return updateWindow;
}

export function getUpdateWindow() {
  return updateWindow;
}
