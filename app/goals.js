const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const bootstrap = require('bootstrap');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('goals.db');
const {Goal, Timer, Requirement} = require('./components.js');
const {add, del, remove, complete, addTimer, editTimer, create, editGoal} = require('./dbFunctions.js');

const e = react.createElement;
const interval = 1000*60*15;

$(document).ready(function() {
  // creates the database
  create();

  //display all current goals
  function displayAll() {
    var current = [];
    var future = [];
    var reqList = [];
    var requirements = [];
    var titles = [];
    var map = new Map();
    var descMap = new Map();

    db.serialize(function() {
      // builds out the requirement selection list from the titles in the goals database
      db.all("SELECT title, desc FROM goals ORDER BY title ASC", function(err, rows) {
        if (rows != null) {
          rows.forEach(function(row) {
            reqList.push(e('option', {key: row.title, value: row.title}, row.title));
            requirements.push(e(Requirement, {key: row.title, value: row.title}))
            titles.push(row);
            descMap.set(row.title, row.desc);
          });
          rd.render(
            requirements,
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

  displayAll();
  displayTimers();

  // resets form field for timer and goal when modal is shown
  $('.modal').on('show.bs.modal', function (e) {
    $(".addForm").trigger("reset");
  });

  // adds the goal to the database
  $("#goalSave").click(function() {
    var formArray = $("#goalForm").serializeArray();
    var title = formArray[0]["value"];
    var desc = formArray[1]["value"];
    var reqs = [];
    $(".checkReq:checked").each(function() {
      reqs.push($(this).val());
    });
    add(title, desc, reqs, displayAll);
  });

  // adds the timer to the database
  $("#timerSave").click(function() {
    var formArray = $("#timerForm").serializeArray();
    var title = formArray[0]["value"];
    var date = formArray[1]["value"];
    var time = formArray[2]["value"];
    addTimer(title, date + " " + time, displayTimers);
  });

  //show edit goal form
  $(document).on("click", ".editButton", function() {
    var title = $(this).siblings(".title").text();
    var desc = $(this).siblings(".desc").text();
    $(this).siblings(".reqList").find("li").each(function() {
      $("#" + $(this).text()).prop("checked", true);
    });
    $('#goalModal').modal('show');
    $("#skillText").val(title);
    $("#descText").val(desc);
  });

  //hides edit goal form
  $(document).on("click", ".cancelButton", function() {
    hideAll($(this), ".goal", ".hidden", ".shown");
  });

  //show edit timer form
  $(document).on("click", ".editTimer", function() {
    hideAll($(this), ".timer", ".shown", ".hidden");
  });

  //hides edit timer form
  $(document).on("click", ".editTimerCancel", function() {
    hideAll($(this), ".timer", ".hidden", ".shown");
  });

  //edits timer
  $(document).on("click", ".editTimerSubmit", function() {
    var title = $(this).parents(".timer").find("h2").text();
    var time = $(this).siblings(".editDate").val() + " " + $(this).siblings(".editTime").val();
    editTimer(title, time, displayTimers);
    hideAll($(this), ".timer", ".hidden", ".shown");
  });

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
    var title = $(this).parents(".goal").find("h2").text();
    var child = $(this).siblings(".requireDiv").find("option:selected").val();
    var desc = $(this).parents(".goal").find(".editDesc").val();
    console.log(desc)
    editGoal(desc, title, displayAll);
  });

  //removes a requirement from a goal
  $(document).on("click", ".removeButton", function() {
    var child = $(this).parents("li").text()
    var parent = $(this).parents(".notification").find(".title").text();
    remove(parent, child, displayAll);
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

  function hideAll(current, container, hideClass, showClass) {
    current.parents(container).find(hideClass).hide();
    current.parents(container).find(showClass).show();
  }
});

// TODO: finish migrating functions over to other files, testing
// TODO: adding a goal with multiple reqs only shows the first req (others appear after refreshing app)
