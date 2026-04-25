import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
import { registerIpcHandlers } from './ipc'

// 加载 .env 文件（开发环境）
dotenvConfig({ path: resolve(process.cwd(), '.env') })

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 700,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,  // renderer 无法访问 Node.js API
      nodeIntegration: false,  // 禁止 renderer 直接使用 Node.js
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  // 外部链接用系统浏览器打开，不在 Electron 窗口内打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 开发：连接 electron-vite 的 HMR 服务；生产：加载打包 HTML
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
