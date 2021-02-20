const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const bootstrap = require('bootstrap');
const moment = require('moment')
const {Goal, Timer, Requirement, Modal} = require('./components.js');
const {add, del, complete, addTimer, editTimer, create, editGoal, getGoals, getReqs, getTimers, timerDone} = require('./dbFunctions.js');

const e = react.createElement;
const interval = 1000*60*1;

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
    var rows = getTimers();
    var done = [];
    rows.forEach(function(row) {
      var d = moment(new Date(row.time)).format("ddd MMM Do [at] HH:mm");
      var u = moment(d, "ddd MMM Do [at] HH:mm").fromNow();
      if (u.includes("ago") && row.done == 0) {
        done.push(row.name);
        timerDone(row.name);
      }
      timers.push(e(Timer, {key: row.name, title: row.name, time: d, desc: row.desc, until: u}, null));
    });

    done.forEach(function(item) {
      alert(item + " is done");
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
      e(Modal, {key: now + "timer", type: 'timer', header: "New Timer", requirements: null}),
      document.getElementById('modals')
    );
    $('#timerModal').modal('show');
  });

  // adds the goal to the database
  $(document).on("click", "#goalSave", function() {
    var values = getGoalForm("#goalForm");
    addToDatabase(values, displayAll, "#goalModal", "#skillText", add);
  });

  // adds the timer to the database
  $(document).on("click", "#timerSave", function() {
    var values = getTimerForm("#timerForm");
    addToDatabase(values, displayTimers, "#timerModal", "#timerTitle", addTimer);
  });

  // tries to add a timer or goal to the database, and dispays errors if unsuccessful
  function addToDatabase(values, cb, modalId, titleId, dbFunction) {
    console.log(values);
    try {
      dbFunction(values[0].toLowerCase().trim(), values[1], values[2], cb);
      $(modalId).modal("hide");
    }
    catch (err) {
      if (err.code == "SQLITE_CONSTRAINT_PRIMARYKEY") {
        $(titleId).addClass("is-danger");
        $(modalId).find(".errors").text("That title is already in use.");
      } else {
        console.log(err);
      }
    }
  }

  // shows edit goal form
  $(document).on("click", ".editButton", function() {
    // gets current values to pre-fill the form
    var title = $(this).siblings(".title").text();
    var desc = $(this).siblings(".desc").text();
    var reqs = [];
    $(this).siblings(".reqList").find("li").each(function() {
      reqs.push($(this).text());
    });
    // determines which requirements to check
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

  // shows the timer edit form
  $(document).on("click", ".editTimer", function() {
    var title = $(this).siblings(".title").text();
    var d = moment($(this).siblings(".time").text(), "ddd MMM Do [at] HH:mm");
    var date = moment(d).format("yyyy-MM-D");
    var time = moment(d).format("HH:mm");
    var desc = $(this).siblings(".desc").text();
    var now = new Date().valueOf();
    rd.render(
      e(Modal, {key: now + "editTimer", type: 'editTimer', header: title, title: title, date: date, time: time, desc: desc}),
      document.getElementById("modals")
    );
    $('#editTimerModal').modal('show');
  });

  // edits the goal
  $(document).on("click", "#editGoalSave", function() {
    var values = getGoalForm("#editGoalForm");
    var old = $(this).parents(".modal-dialog").find(".modal-title").text();
    editGoal(values.desc, values.title, old, values.reqs, displayAll);
  });

  // edits timer
  $(document).on("click", "#editTimerSave", function() {
    var values = getTimerForm("#editTimerForm");
    var old = $(this).parents(".modal-dialog").find(".modal-title").text();
    editTimer(values.title, values.date, values.desc, old, displayTimers);
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

  // delete goal or timer
  $(document).on("click", ".deleteButton", function() {
    var table = $(this).parents(".column").children("h1").text().includes("Goals") ? "goals" : "timers";
    var name = table == "goals" ? "title" : "name";
    var cb = table == "goals" ? displayAll : displayTimers;
    var value = $(this).siblings("h2").text();
    del(value, table, name, cb);
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

  // gets the values from submitting a goal form
  function getGoalForm(id) {
    var formArray = $(id).serializeArray();
    var title = formArray[0]["value"];
    var desc = formArray[1]["value"];
    var reqs = [];
    for (var i = 2; i < formArray.length; i++) {
      reqs.push(formArray[i]["name"]);
    }
    return {
      0: title,
      1: desc,
      2: reqs
    };
  }

  // gets the values from submitting a timer form
  function getTimerForm(id) {
    var formArray = $(id).serializeArray();
    var title = formArray[0]["value"];
    var date = formArray[1]["value"];
    var time = formArray[2]["value"];
    var desc = formArray[3]["value"];
    return {
      0: title,
      1: date + " " + time,
      2: desc
    };
  }
});

// TODO: finish migrating functions over to other files
// TODO: testing
// TODO: remove callbacks from db functions
