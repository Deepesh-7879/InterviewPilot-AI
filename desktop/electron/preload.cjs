const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('interviewPilot', Object.freeze({version:'0.1.0'}));
