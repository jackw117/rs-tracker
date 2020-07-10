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
    var deleteButton = "<button class='delete deleteButton'></button>";
    $("<div class='notification is-link is-light goal'>" +
        "<h1 class='title is-uppercase is-size-5'>" + title + "</h1>" +
        "<p class='subtitle is-uppercase is-size-6'>" + reqs + "</p>" +
        edit + deleteButton + "</div>").appendTo("#database");

    addRequirements(element, "#require");
  }

  //add new goal to requirements form field
  function addRequirements(element, where) {
    $("<option value='"+element.title+"'>"+element.title+"</option>").appendTo(where);
  }

  //updates the parent/require array of an element
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
  db.createTable(tableName, (succ, msg) => {});

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
        // TODO: fix for multiple edits being open at once (multiple goals and same goal)
        addRequirements(element, "#requireEdit")
      });
    });
  });

  //remove item from every require/parent array
  function removeField(selection, type) {
    db.getField(tableName, type, (succ, data) => {
      if (succ) {
        data.forEach(function(element, i) {
          element = jQuery.grep(element, function(value) {
            return value != selection;
          });
          data[i] = element;
        });
        db.getAll(tableName, (succ2, data2) => {
          data2.forEach(function(element, i) {
            if (element[type] != data[i]) {
              var where = {"title": element.title};
              var set = {[type]: data[i]};
              db.updateRow(tableName, where, set, (succ, msg) => {});
            }
          });
        });
      }
    });
  }

  //delete goal
  $(".deleteButton").click(function() {
    var selection = $(this).siblings("h1").text();
    removeField(selection, "require");
    removeField(selection, "parents");
    db.deleteRow(tableName, {"title": selection}, (succ, msg) => {});
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
