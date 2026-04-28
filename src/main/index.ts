import { join } from 'path'
import { resolve } from 'path'

import { app, shell, BrowserWindow } from 'electron'
import { config as dotenvConfig } from 'dotenv'

import { registerAll } from './ipc/index'

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
      contextIsolation: true, // renderer 无法访问 Node.js API
      nodeIntegration: false, // 禁止 renderer 直接使用 Node.js
      sandbox: false,
    },
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

  // F12 / Ctrl+Shift+I (Win/Linux) / Cmd+Option+I (macOS) 打开/关闭开发者工具
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isDevToolsShortcut =
      input.key === 'F12' ||
      (input.control && input.shift && input.key === 'I') ||
      (input.meta && input.alt && input.key === 'I')
    if (isDevToolsShortcut) {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })
}

// app.whenReady() 是 Electron 应用的初始化完成阶段的生命钩子。触发时机：主进程启动，地层chromium环境初始化完毕
// 在这个阶段resolve后，可以注册ipc处理器，创建窗口等操作。确保这些操作在Electron环境完全准备好后执行，避免潜在的错误和不稳定行为。
app.whenReady().then(() => {
  registerAll()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
