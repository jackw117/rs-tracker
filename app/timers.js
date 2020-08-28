// $(document).ready(function() {
//   const db = require('electron-db');
//   const { app, BrowserWindow } = require("electron");
//   const tableName = "timers";
//
//   //current timer being created
//   var obj = new Object();
//
//   //creates the timers table if it doesn't already exist
//   db.createTable(tableName, (succ, msg) => {});
//
//   //add timer to database
//   $("#timerButton").click(function() {
//     obj.title = $("#timerTitle").val();
//     obj.when = $("#timerTime").val();
//     obj.desc = $("#timerDesc").val();
//     db.insertTableContent(tableName, obj, (succ, msg) => {
//       // succ - boolean, tells if the call is successful
//       console.log(succ);
//     });
//   });
// });
