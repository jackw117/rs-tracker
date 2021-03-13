const electron = require('electron');
const path = require('path');
const iconPath = path.join(__dirname, "src", "icon.png");

const app = electron.app;

var BrowserWindow = electron.BrowserWindow;

//const mainWindow;

app.on('window-all-closed', function () {
  app.quit();
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: false
    },
    icon: iconPath
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // starts with dev tools open
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
