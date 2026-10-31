const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800, backgroundColor:'#0b1020', webPreferences: {
    preload:path.join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true
  }});
  win.webContents.setWindowOpenHandler(({url}) => { if (url.startsWith('https://')) shell.openExternal(url); return {action:'deny'}; });
  win.loadURL('http://127.0.0.1:5173');
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
