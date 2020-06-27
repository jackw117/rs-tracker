const {
  app,
  BrowserWindow
} = require('electron')
const url = require("url");
const path = require("path");

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Connection URL
var client = new MongoClient('mongodb://localhost:27017/', {useUnifiedTopology: true});

// Use connect method to connect to the Server
client.connect().then((client)=>{
  var db = client.db('db_name')
  db.collection('skills').find().toArray(function (err, result) {
    if (err) throw err
      console.log(result);
  });
});

let appWindow

function initWindow() {
  appWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Electron Build Path
  appWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/index.html`),
      protocol: "file:",
      slashes: true
    })
  );

  appWindow.on('closed', function () {
    appWindow = null
  })
}

app.on('ready', initWindow)

// Close when all windows are closed.
app.on('window-all-closed', function () {

  // On macOS specific close process
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (win === null) {
    initWindow()
  }
})
