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
        current.push(e(Goal, {key: value.title, title: value.title, desc: value.desc}, null));
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

  // click the add goal button
  $("#addGoalButton").click(function() {
    displayModal("goal", "New Goal", requirements, "#goalModal");
  });

  // click the add timer button
  $("#addTimerButton").click(function() {
    displayModal("timer", "New Timer", null, "#timerModal");
  });

  // displays modal for adding or editing a goal/timer
  function displayModal(type, header, reqs, modalId, date, time, desc, title) {
    var now = new Date().valueOf();
    var modal = e(Modal, {key: now + type, type: type, header: header, requirements: reqs, date: date, time: time, desc: desc, title: title});
    rd.render(
      modal,
      document.getElementById('modals')
    );
    $(modalId).modal('show');
  }

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
  function addToDatabase(values, display, modalId, titleId, addItem) {
    try {
      addItem(values[0].toLowerCase().trim(), values[1], values[2]);
      $(modalId).modal("hide");
      display();
    }
    catch (err) {
      errorCatch(err, titleId, modalId)
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
    displayModal("editGoal", title, currentReqs, "#editGoalModal", null, null, desc, title);
  });

  // shows the timer edit form
  $(document).on("click", ".editTimer", function() {
    var d = moment($(this).siblings(".time").text(), "ddd MMM Do [at] HH:mm");
    var date = moment(d).format("yyyy-MM-DD");
    var time = moment(d).format("HH:mm");
    console.log("d: " + d + " date: " + date + " time: " + time);
    var title = $(this).siblings(".title").text();
    var desc = $(this).siblings(".desc").text();
    displayModal("editTimer", title, null, "#editTimerModal", date, time, desc, title);
  });

  // function for handling certain key presses
  $(document).keydown(function(e) {
    // hide the current modal if the user hits the ESC key
    if (e.keyCode == 27) {
      $(".modal").modal("hide");
    }
    // submit the current modal if the user hits the ENTER key
    else if (e.keyCode == 13) {
      e.preventDefault();
      if ($(".modal").is(":visible")) {
        // clicks the save button which triggers the id's on click event
        $(".saveButton").click();
      }
    }
  });

  // edits the goal
  $(document).on("click", "#editGoalSave", function() {
    var values = getGoalForm("#editGoalForm");
    editGoalTimer("#editGoalModal", values, editGoal, displayAll, "#skillText");
  });

  // edits timer
  $(document).on("click", "#editTimerSave", function() {
    var values = getTimerForm("#editTimerForm");
    editGoalTimer("#editTimerModal", values, editTimer, displayTimers, "#timerTitle");
  });

  // function to edit either a goal or a timer
  function editGoalTimer(modalId, values, edit, display, titleId) {
    try {
      var old = $(modalId).find(".modal-title").text();
      edit(values[0], values[1], values[2], old);
      $(modalId).modal("hide");
      display();
    }
    catch (err) {
      errorCatch(err, titleId, modalId)
    }
  }

  // remove the current goal and all its children
  $(document).on("click", '.doneButton', function() {
    var parent = $(this).siblings(".title").text();
    var reqs = [];
    $(this).siblings(".reqList").find("li").each(function() {
      reqs.push($(this).text());
    });
    complete(parent, reqs);
    displayAll();
  });

  // delete goal
  $(document).on("click", ".deleteGoal", function() {
    var value = $(this).siblings("h2").text();
    deleteGoalTimer("goals", "title", value, displayAll);
  });

  // delete timer
  $(document).on("click", ".deleteTimer", function() {
    var value = $(this).siblings("h2").text();
    deleteGoalTimer("timers", "name", value, displayTimers);
  });

  // function for deleting a goal/timer
  function deleteGoalTimer(table, name, value, display) {
    del(value, table, name);
    display();
  }

  // sets the interval to call the displayTimers function to refresh the times
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

  // display errors on modal submit
  function errorCatch(err, titleId, modalId) {
    if (err.code == "SQLITE_CONSTRAINT_PRIMARYKEY") {
      $(titleId).addClass("is-danger");
      $(modalId).find(".errors").text("That title is already in use.");
    } else {
      console.log(err);
    }
  }
});

// TODO: finish migrating functions over to other files
// TODO: testing
