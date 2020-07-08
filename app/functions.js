$(document).ready(function() {
  //connect to database (JSON file)
  const db = require('electron-db');
  const { app, BrowserWindow } = require("electron");
  const tableName = "goals";

  //current goal being created
  var obj;

  //creates a new goal object
  function newObject() {
    obj = new Object();
    obj.require = new Array();
    obj.parents = new Array();
  }

  //adds a goal to the page
  function appendToDatabase(element) {
    var reqs = "<ul class='reqList subtitle is-size-6 is-uppercase'>";
    element.require.forEach((item, i) => {
      reqs = reqs + "<li>" + item + "</li>";
    });
    reqs = reqs + "</ul>";
    var title = "<p>" + element.title + "</p>";
    var edit = "<input type='button' class='editButton button is-danger' value='Edit'>";
    $("<div class='notification is-link is-light goal'>" +
        "<h1 class='title is-uppercase is-size-5'>" + title + "</h1>" +
        "<p class='subtitle is-uppercase is-size-6'>" + reqs + "</p>" +
        edit + "</div>").appendTo("#database");

    addRequirements(element, "#require");
  }

  //add new goal to requirements form field
  function addRequirements(element, where) {
    $("<option value='"+element.title+"'>"+element.title+"</option>").appendTo(where);
  }

  //true for parent, false for requirement
  function updateArray(element, newTitle, type) {
    console.log(element);
    db.getRows(tableName, {
      title: element
    }, (succ, result) => {
      if (succ) {
        var setArray;
        var set;
        var where = {"title": element}
        if (type) {
          setArray = result[0].parents;
          setArray.push(newTitle);
          set = {"parents": setArray};
        } else {
          console.log(result);
          setArray = result[0].require;
          setArray.push(newTitle);
          set = {"require": setArray};
        }
        db.updateRow(tableName, where, set, (succ, msg) => {
          console.log(succ);
        });
      }
    });
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
    data.forEach(function(element) {
      appendToDatabase(element);
    });
  });

  //show the goal form after clicking the add button
  $("#add").click(function() {
    $(".addNew").hide();
    $(".newType").show();
  });

  //show edit form
  $(".editButton").click(function() {
    var reqs = "<div class='editSelect select is-danger'><select id='requireEdit' class='select is-danger'><option value='none'>None</option></select></div><input type='button' id='addReqEdit' value='Confirm Edit' class='button is-danger'>";
    $(reqs).appendTo($(this).parent());
    db.getAll(tableName, (succ, data) => {
      data.forEach(function(element) {
        //fix for multiple edits being open at once
        addRequirements(element, "#requireEdit")
      });
    });
  });

  //edit goal
  $(".goal").on("click", "#addReqEdit", function() {
    var selection = $(this).siblings(".editSelect").find("option:selected").val();
    var current = $(this).parent(".goal").find("h1").text();
    $("<li>" + selection + "</li>").appendTo($(this).parent(".goal").find(".reqList"));
    updateArray(current, selection, false);
    updateArray(selection, current, true);
  });

  //add currently selected requirement to the list and display on page
  $("#reqButton").click(function() {
    var selection = $("#require").val();
    $("<p>" + selection + "</p>").appendTo("#currentReqs");
    obj.require.push(selection);
  });

  //add the goal to the database
  $("#skill").click(function() {
    obj.title = $("#skillText").val();
    db.insertTableContent(tableName, obj, (succ, msg) => {
      // succ - boolean, tells if the call is successful
      if (succ) {
        appendToDatabase(obj);
        obj.require.forEach(function(element) {
          if (element != "none") {
            updateArray(element, obj.title, true);
          }
        });
        $("#currentReqs").html("");
      }
    });

    newObject();
  });
});
