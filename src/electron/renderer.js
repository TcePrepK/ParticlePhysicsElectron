const {app, ipcMain} = require("electron");
const fs = require("fs");
const path = require("path");

ipcMain.on("read-file", (event, ...filePath) => {
    try {
        if (!(filePath instanceof Array)) filePath = [filePath];
        console.log("Reading file", filePath);
        event.returnValue = fs.readFileSync(path.join(__dirname, ...filePath), "utf8");
    } catch (error) {
        event.returnValue = error;
    }
});

ipcMain.on("calculate-path", (event, ...filePath) => {
    try {
        if (!(filePath instanceof Array)) filePath = [filePath];
        event.returnValue = path.join(...filePath);
    } catch (error) {
        event.returnValue = error;
    }
});