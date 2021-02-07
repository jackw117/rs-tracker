const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('goals.db');
const {Goal, Timer} = require('./components.js')
const {add, del, remove, addReq, complete, addTimer, editTimer} = require('./dbFunctions.js')

const e = react.createElement;
const interval = 1000*60*15

$(document).ready(function() {
  //creates the database if it doesn't already exist
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS goals (title TEXT PRIMARY KEY, desc TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS reqs (parent TEXT, child TEXT, FOREIGN KEY (parent) REFERENCES goals(title) ON DELETE CASCADE, FOREIGN KEY (child) REFERENCES goals(title) ON DELETE CASCADE)");
    db.run("CREATE TABLE IF NOT EXISTS timers (name TEXT PRIMARY KEY, time TEXT)");
    db.run("PRAGMA foreign_keys = ON");
  });

  //creates a new goal object
  function newObject() {
    var o = new Object();
    o.require = new Array();
    o.parents = new Array();
    o.reqList = new Array();
    return o;
  }

  //display all current goals
  function displayAll() {
    var current = [];
    var future = [];
    var reqList = [];
    var titles = [];
    var map = new Map();
    var descMap = new Map();

    db.serialize(function() {
      // builds out the requirement selection list from the titles in the goals database
      db.all("SELECT title, desc FROM goals ORDER BY title ASC", function(err, rows) {
        if (rows != null) {
          rows.forEach(function(row) {
            reqList.push(e('option', {key: row.title, value: row.title}, row.title));
            titles.push(row);
            descMap.set(row.title, row.desc);
          });
          rd.render(
            reqList,
            document.getElementById("requireList")
          );
        }
      });

      db.all("SELECT parent, child FROM reqs", function(err, rows) {
        if (rows != null) {
          // creates map of parent goals to their requirements
          rows.forEach(function(row) {
            if (map.has(row.parent)) {
              var temp = map.get(row.parent);
              temp.push(row.child);
              map.set(row.parent, temp);
            } else {
              map.set(row.parent, [row.child]);
            }
          });

          // builds out the goals with dependencies to be added to the futureList section
          map.forEach(function(value, key) {
            var reqList2 = reqList.filter(i => i.key !== key && !(value.includes(i.key)));
            future.push(e(Goal, {key: key, title: key, reqs: value, desc: descMap.get(key), select: reqList2}, null));
          });

          // builds out the goals to add to the currentList section based on which ones are not in the reqs table
          titles.forEach(function(value) {
            if (!map.has(value.title)) {
              var reqList2 = reqList.filter(i => i.key !== value.title);
              current.push(e(Goal, {key: value.title, title: value.title, desc: value.desc, reqs: [], select: reqList2}, null));
            }
          });

          rd.render(
            current,
            document.getElementById("currentList")
          );

          // sort future goals list by number of requirements
          future.sort(function(a, b){
            return a.props.reqs.length - b.props.reqs.length;
          });
          rd.render(
        		future,
        		document.getElementById("futureList")
        	);
        }
      });
    });
    obj = newObject();
    obj.reqList = reqList;
  }

  function displayTimers() {
    var timers = [];
    var now = new Date();
    db.all("SELECT name, time FROM timers", function(err, rows) {
      if (rows != null) {
        rows.forEach(function(row) {
          timers.push(e(Timer, {key: row.name, title: row.name, time: row.time}, null));
          var until = now - new Date(row.time);
          if (0 <= until && until <= interval) {
            alert(row.name + " is ready now");
          }
        });

        timers = timers.filter(i => i != null);
        rd.render(
          timers,
          document.getElementById("timerList")
        );
      }
    });
  }

  //current goal being created
  var obj;
  displayAll();
  displayTimers();

  //show the goal form after clicking the add button
  $(".add").click(function() {
    $(this).hide();
    $(this).siblings("div").show();
    if (obj.reqList.length != 0) {
      $("#addReqDiv").show();
    } else {
      $("#addReqDiv").hide();
    }
    $("#skillText").val("");
    $("#descText").val("");
  });

  //cancels adding a new goal to the datbase
  $(".cancel").click(function() {
    $(this).parents(".addDiv").children(".add").show();
    $(this).parents(".addDiv").children("div").hide();
    $(this).parents(".addDiv").find("#currentReqs").html("");
    displayAll();
  });

  //show edit form
  $(document).on("click", ".editButton", function() {
    $(this).hide();
    $(this).siblings(".reqList").find("input").show();
    $(this).siblings(".editSelect").show();
  });

  //show edit timer form
  $(document).on("click", ".editTimer", function() {
    $(this).parents(".timerInfo").hide();
    $(this).parents(".timerInfo").siblings(".editDiv").show();
  });



  function cancel(x) {
    x.parents(".editDiv").hide();
    x.parents(".editDiv").siblings(".timerInfo").show();
  }

  // remove the current goal and all its children
  $(document).on("click", '.doneButton', function() {
    var parent = $(this).siblings(".title").text();
    var reqs = [];
    $(this).siblings(".reqList").find("li").each(function() {
      reqs.push($(this).text());
    });
    complete(parent, reqs, displayAll);
  });

  //delete goal or timer
  $(document).on("click", ".deleteButton", function() {
    var table = $(this).parents(".column").children("h1").text().includes("Goals") ? "goals" : "timers";
    var name = table == "goals" ? "title" : "name";
    var cb = table == "goals" ? displayAll : displayTimers;
    var value = $(this).siblings("h2").text();
    del(value, table, name, cb);
  });

  //add requirement to goal
  $(document).on("click", ".addReqEdit", function() {
    var parent = $(this).parents(".goal").find("h2").text();
    var child = $(this).siblings(".requireDiv").find("option:selected").val();
    addReq(parent, child, displayAll);
  });

  //edits timer
  $(document).on("click", ".editTimerSubmit", function() {
    var title = $(this).parents(".timer").find("h2").text();
    var time = $(this).siblings(".editDate").val() + " " + $(this).siblings(".editTime").val();
    editTimer(title, time, displayTimers);
    cancel($(this));
  });

  //add currently selected requirement to the list and display on page
  $("#reqButton").click(function() {
    var selection = $("#requireList:first").val();
    obj.reqList = obj.reqList.filter(i => i.key !== selection);
    $("<li>" + selection + "</li>").appendTo("#currentReqs");
    obj.require.push(selection);
    rd.render(
      obj.reqList,
      document.getElementById("requireList")
    );
    if (obj.reqList.length == 0) {
      $("#addReqDiv").hide();
    }
  });

  //removes a requirement from a goal
  $(document).on("click", ".removeButton", function() {
    var child = $(this).parents("li").text()
    var parent = $(this).parents(".notification").find(".title").text();
    remove(parent, child, displayAll);
  });

  //cancels editing the goal
  $(document).on("click", ".cancelButton", function() {
    $(this).parents(".editSelect").hide();
    $(this).parents(".notification").find(".removeButton").hide();
    $(this).parents(".notification").find(".editButton").show();
  });

  //cancels editing the timer
  $(document).on("click", ".editTimerCancel", function() {
    cancel($(this));
  });

  //add the goal to the database
  $("#skill").click(function() {
    $("#currentReqs").html("");
    $(".newType").hide();
    $(".add").show();
    var value = $("#skillText").val();
    var desc = $("#descText").val();
    add(value, desc, obj.require, displayAll);
  });

  //adds the timer to the database
  $("#timerButton").click(function() {
    var title = $("#timerTitle").val();
    var date = $("#timerDate").val() + " " + $("#timerTime").val();
    $("#timerTitle").val("");
    $("#timerDate").val("");
    $("#timerTime").val("");
    $(this).parents(".newType").hide();
    $(this).parents(".newType").siblings("input").show();
    addTimer(title, date, displayTimers);
  });

  setInterval(function() {
    var d1 = new Date();
    $(".time").each(function() {
      var d2 = new Date($(this).text());
      var n = d2.getTime() - d1.getTime();
      if (n < 0) {
        alert("Timer for " + $(this).siblings("h2").text() + " is done");
      }
    });
    displayTimers();
  }, interval);
});

// work on timers
// data checks for timers
// TODO: finish migrating functions over to other files, testing
