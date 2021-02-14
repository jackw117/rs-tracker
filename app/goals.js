const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const bootstrap = require('bootstrap');
const {Goal, Timer, Requirement, Modal} = require('./components.js');
const {add, del, complete, addTimer, editTimer, create, editGoal, getGoals, getReqs, getTimers} = require('./dbFunctions.js');

const e = react.createElement;
const interval = 1000*60*15;

$(document).ready(function() {
  // creates the database
  create();

  var titles = [];
  var requirements = [];

  //display all current goals
  function displayAll() {
    var current = [];
    var future = [];
    requirements = [];
    titles = [];
    var map = new Map();
    var descMap = new Map();

    // builds out the requirement selection list from the titles in the goals database
    var goals = getGoals();
    goals.forEach(function(row) {
      requirements.push(e(Requirement, {key: row.title, value: row.title, checked: false}))
      titles.push(row);
      descMap.set(row.title, row.desc);
    });

    // creates map of parent goals to their requirements
    var reqs = getReqs();
    reqs.forEach(function(row) {
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
      future.push(e(Goal, {key: key, title: key, reqs: value, desc: descMap.get(key)}, null));
    });

    // builds out the goals to add to the currentList section based on which ones are not in the reqs table
    titles.forEach(function(value) {
      if (!map.has(value.title)) {
        current.push(e(Goal, {key: value.title, title: value.title, desc: value.desc, reqs: []}, null));
      }
    });

    // sort future goals list by number of requirements
    future.sort(function(a, b){
      return a.props.reqs.length - b.props.reqs.length;
    });

    rd.render(
      current,
      document.getElementById("currentList")
    );

    rd.render(
      future,
      document.getElementById("futureList")
    );
  }

  function displayTimers() {
    var timers = [];
    var now = new Date();
    var rows = getTimers();
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

  displayAll();
  displayTimers();

  // displays the add goal form
  $("#addGoalButton").click(function() {
    var now = new Date().valueOf();
    rd.render(
      e(Modal, {key: now + "goal", type: 'goal', header: "New Goal", requirements: requirements, title: "", desc: ""}),
      document.getElementById('modals')
    );
    $('#goalModal').modal('show');
  });

  // displays the add timer form
  $("#addTimerButton").click(function() {
    var now = new Date().valueOf();
    rd.render(
      e(Modal, {key: now + "timer", type: 'timer', header: "New Timer", requirements: null, title: "", desc: ""}),
      document.getElementById('modals')
    );
    $('#timerModal').modal('show');
  });

  // adds the goal to the database
  $(document).on("click", "#goalSave", function() {
    var formArray = $("#goalForm").serializeArray();
    var title = formArray[0]["value"];
    var desc = formArray[1]["value"];
    var reqs = [];
    $(".checkReq:checked").each(function() {
      reqs.push($(this).siblings("#" + this.id + "Label").text());
    });
    console.log(reqs);
    add(title, desc, reqs, displayAll);
  });

  $(document).on("click", "#editGoalSave", function() {
    var formArray = $("#editGoalForm").serializeArray();
    var title = formArray[0]["value"];
    var desc = formArray[1]["value"];
    var old = $(this).parents(".modal-dialog").find(".modal-title").text();
    var reqs = [];
    for (var i = 2; i < formArray.length; i++) {
      reqs.push(formArray[i]["name"]);
    }
    console.log(reqs);
    editGoal(desc, title, old, reqs, displayAll);
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
    var reqs = [];
    $(this).siblings(".reqList").find("li").each(function() {
      reqs.push($(this).text());
    });
    var currentTitles = titles.filter(x => x.title != title);
    var currentReqs = [];
    currentTitles.forEach(function(req) {
      var check = reqs.includes(req.title) ? true : false;
      currentReqs.push(e(Requirement, {key: req.title, value: req.title, checked: check}));
    });
    var now = new Date().valueOf();
    rd.render(
      e(Modal, {key: now + "edit", type: 'editGoal', header: title, requirements: currentReqs, title: title, desc: desc}),
      document.getElementById("modals")
    );
    $('#editGoalModal').modal('show');
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
