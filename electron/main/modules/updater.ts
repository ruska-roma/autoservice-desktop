import log from 'electron-log/main.js';
import electronUpdater, { type AppUpdater } from 'electron-updater';

import { createUpdateWindow, getUpdateWindow } from './updateWindow';

function getAutoUpdater(): AppUpdater {
  const { autoUpdater } = electronUpdater;
  return autoUpdater;
}

export function initAutoUpdater() {
  log.initialize();
  log.transports.file.level = 'debug';

  const autoUpdater = getAutoUpdater();
  autoUpdater.allowPrerelease = true;
  autoUpdater.logger = log;

  autoUpdater.on('checking-for-update', () => {
    log.info('Проверка наличия обновлений...');
  });
  autoUpdater.on('update-available', (info) => {
    log.info('Доступно обновление:', info);
    createUpdateWindow();
  });
  autoUpdater.on('update-not-available', (info) => {
    log.info('Нет доступных обновлений:', info);
  });
  autoUpdater.on('error', (err) => {
    log.error('Ошибка проверки обновлений:', err);
    const win = getUpdateWindow();
    if (win) {
      win.webContents.send('update-error', err.message);
    }
  });
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    const win = getUpdateWindow();
    if (win) {
      win.webContents.send('update-progress', percent);
    }
  });
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Обновление загружено:', info);
    const win = getUpdateWindow();
    if (win) {
      win.webContents.send('update-finished');
    }
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdatesAndNotify();
}
