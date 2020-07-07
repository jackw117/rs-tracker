$(document).ready(function() {
  //connect to database (JSON file)
  const db = require('electron-db');
  const { app, BrowserWindow } = require("electron");
  const tableName = "goals";

  var obj;

  function newObject() {
    obj = new Object();
    obj.require = new Array();
  }

  newObject();

  //creates the goals table if it doesn't already exist
  db.createTable(tableName, (succ, msg) => {
    // succ - boolean, tells if the call is successful
    console.log("Success: " + succ);
    console.log("Message: " + msg);
  });

  //display all current goals
  db.getAll(tableName, (succ, data) => {
    // succ - boolean, tells if the call is successful
    // data - array of objects that represents the rows.
    console.log(data);
    data.forEach(function(element) {
      $("<div class='goal'>"+element.title+"</div>").appendTo("#database");
      $("<option value='"+element.title+"'>"+element.title+"</option>").appendTo("#require");
    });
  });

  //show the goal form after clicking the add button
  $("#add").click(function() {
    $(".addNew").hide();
    $(".newType").show();
  });

  //add currently selected requirement to the list and display on page
  $("#reqButton").click(function() {
    var selection = $("#require").val();
    $("<p>" + selection + "</p>").appendTo("#currentReqs");
    obj.require.push(selection);
  });

  let term = "KBD";

  db.search(tableName, 'title', term, (succ, data) => {
    if (succ) {
      console.log(data);
    }
  });

  //add the goal to the database
  $("#skill").click(function() {
    obj.title = $("#skillText").val();
    db.insertTableContent(tableName, obj, (succ, msg) => {
      // succ - boolean, tells if the call is successful
      console.log("Success: " + succ);
      console.log("Message: " + msg);
    });

    newObject();
  });
});
