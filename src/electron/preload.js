const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    readFile: (...filePath) => ipcRenderer.sendSync("read-file", ...filePath),
    calculatePath: (...filePath) => ipcRenderer.sendSync("calculate-path", ...filePath)
});

console.log("✅ Preload loaded successfully!");