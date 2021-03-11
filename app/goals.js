const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const moment = require('moment')
const component = require('./components.js');
const db = require('./dbFunctions.js');

const e = react.createElement;
const interval = 1000*60*1;

$(document).ready(function() {
  // creates the database
  db.create();

  var titles = [];
  var requirements = [];

  var account = db.getAccountMain();
  console.log(account)
  if (account) {
    displayAll();
    displayTimers();
  } else {
    // TODO: display un closable modal telling user to create account
  }

  //display all current goals
  function displayAll() {
    var current = [];
    var future = [];
    requirements = [];
    titles = [];
    var map = new Map();
    var descMap = new Map();

    rd.render(
      e('span', {}, account.name),
      document.getElementById('accountTitle')
    );

    // builds out the requirement selection list from the titles in the goals database
    var goals = db.getGoals(account.ID);
    goals.forEach(function(row) {
      requirements.push(e(component.Requirement, {key: row.title, value: row.ID, checked: false, type: "checkbox", name: row.title, label: row.title}))
      titles.push(row);
      descMap.set(row.title, row.desc);
    });

    // creates map of parent goals to their requirements
    var reqs = db.getReqs(account.ID);
    console.log(reqs)
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
      future.push(e(component.Goal, {key: key, title: key, reqs: value, desc: descMap.get(key), gradient: "to right, #1f1c2c, #928dab"}, null));
    });

    // builds out the goals to add to the currentList section based on which ones are not in the reqs table
    titles.forEach(function(value) {
      if (!map.has(value.title)) {
        current.push(e(component.Goal, {key: value.title, title: value.title, desc: value.desc, gradient: "to right, #7f7fd5, #86a8e7, #91eae4"}, null));
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
    var rows = db.getTimers();
    var done = [];
    rows.forEach(function(row) {
      var d = moment(new Date(row.time)).format("ddd MMM Do [at] HH:mm");
      var u = moment(d, "ddd MMM Do [at] HH:mm").fromNow();
      if (u.includes("ago") && row.done == 0) {
        done.push(row.name);
        db.timerDone(row.name);
      }
      timers.push(e(component.Timer, {key: row.name, title: row.name, time: d, desc: row.desc, until: u}, null));
    });

    if (done.length > 0) {
      rd.render(
        e(component.Message, {key: done, titles: done}),
        document.getElementById("messages")
      );
    }

    timers = timers.filter(i => i != null);
    rd.render(
      timers,
      document.getElementById("timerList")
    );
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

  $("#addAccountButton").click(function() {
    var modal = e(component.AccountModal, {key: "account", type: "account", header: "New Account"});
    displayModal(modal, "#accountModal");
  });

  $("#switchAccountButton").click(function() {
    var accounts = db.getAccounts();
    var modal = e(component.SwitchAccountModal, {key: "switchAccount", type: "switchAccount", header: "Switch Accounts", accounts: accounts});
    displayModal(modal, "#switchAccountModal");
  });

  // click the add goal button
  $("#addGoalButton").click(function() {
    var modal = e(component.GoalModal, {key: "goal", type: "goal", header: "New Goal", requirements: requirements});
    displayModal(modal, "#goalModal");
  });

  // click the add timer button
  $("#addTimerButton").click(function() {
    var modal = e(component.TimerModal, {key: "timer", type: "timer", header: "New Timer"});
    displayModal(modal, "#timerModal");
  });

  // hides modal on a click outside of the modal or on the close modal button
  $(document).on("click", ".modal-background, .closeModal", function() {
    clearReact('modals')
  });

  // function for handling certain key presses
  $(document).keydown(function(e) {
    // hide the current modal if the user hits the ESC key
    if (e.keyCode == 27) {
      $(".modal").removeClass('is-active');
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

  $(document).on("click", ".reqButton", function() {
    if ($(this).hasClass("is-primary clicked")) {
      $(this).removeClass("is-primary clicked");
    } else {
      $(this).addClass("is-primary clicked");
    }
  });

  $(document).on("click", "#accountSave", function() {
    var formArray = $("#accountForm").serializeArray();
    var name = formArray[0]["value"];
    try {
      db.addAccount(name);
      account = db.getAccountMain();
      displayAll();
      displayTimers();
      $(".modal").removeClass('is-active');
    } catch (err) {
      console.log(err);
      // reset current account to be the main account
      db.editAccount(accountName, 1);
    }
  });

  // adds the goal to the database
  $(document).on("click", "#goalSave", function() {
    var values = getGoalForm("#goalForm");
    console.log(values);
    addToDatabase(values, displayAll, "#goalModal", "#skillText", db.addGoal, account.ID);
  });

  // adds the timer to the database
  $(document).on("click", "#timerSave", function() {
    var values = getTimerForm("#timerForm");
    addToDatabase(values, displayTimers, "#timerModal", "#timerTitle", db.addTimer, account.ID);
  });

  // shows edit goal form
  $(document).on("click", ".editButton", function() {
    // gets current values to pre-fill the form
    console.log("Hello there")
    var title = $(this).parents(".goal").find(".title").text();
    var desc = $(this).parents(".goal").find(".desc").text();
    var reqs = [];
    $(this).parents(".goal").find("li").each(function() {
      reqs.push($(this).text());
    });
    // determines which requirements to check
    var currentTitles = titles.filter(x => x.title != title);
    var currentReqs = [];
    currentTitles.forEach(function(req) {
      var check = reqs.includes(req.title) ? true : false;
      currentReqs.push(e(component.Requirement, {key: req.title, value: req.ID, checked: check, type: "checkbox", name: req.title, label: req.title}));
    });
    var modal = e(component.GoalModal, {key: "editGoal", type: "editGoal", header: "Edit Goal", requirements: currentReqs, title: title, desc: desc});
    displayModal(modal, "#editGoalModal");
  });

  // shows the timer edit form
  $(document).on("click", ".editTimer", function() {
    var d = moment($(this).parents(".timer").find(".time").text(), "ddd MMM Do [at] HH:mm");
    var date = moment(d).format("yyyy-MM-DD");
    var time = moment(d).format("HH:mm");
    console.log("d: " + d + " date: " + date + " time: " + time);
    var title = $(this).parents(".timer").find(".title").text();
    var desc = $(this).parents(".timer").find(".desc").text();
    var modal = e(component.TimerModal, {key: "editTimer", type: "editTimer", header: "Edit Timer", title: title, desc: desc, date: date, time: time});
    displayModal(modal, "#editTimerModal");
  });

  // edits the goal
  $(document).on("click", "#editGoalSave", function() {
    var values = getGoalForm("#editGoalForm");
    var id = db.getGoalID(values[0], account.ID);
    console.log(id["ID"])
    editGoalTimer("#editGoalModal", values, db.editGoal, displayAll, "#skillText", id["ID"]);
  });

  // edits timer
  $(document).on("click", "#editTimerSave", function() {
    var values = getTimerForm("#editTimerForm");
    var id = db.getTimerID(values[0], account.ID);
    console.log(id)
    editGoalTimer("#editTimerModal", values, db.editTimer, displayTimers, "#timerTitle", id["ID"]);
  });

  $(document).on("click", "#switchAccountSave", function() {
    var formArray = $("#switchAccountForm").serializeArray();
    var name = formArray[0]["value"];

    $(".modal").removeClass('is-active');
    // deselect old account
    db.editAccount(account.name, 0);
    accountName = name;
    // sets the swapped account as main
    db.editAccount(name, 1);
    account = db.getAccountMain();
    displayAll();
    displayTimers();
  })

  // remove the current goal and all its children
  $(document).on("click", '.doneButton', function() {
    var parent = $(this).parents(".card").find(".title").text();
    var deleteList = [parent];
    $(this).parents(".card").find("li").each(function() {
      deleteList.push($(this).text());
    });
    console.log(deleteList)
    db.complete(parent, deleteList, account.ID);
    displayAll();
  });

  // delete goal
  $(document).on("click", ".deleteGoal", function() {
    var value = $(this).parents(".goal").find(".title").text();
    db.deleteGoal(value, account.ID);
    displayAll();
    // deleteGoalTimer("goals", "title", value, displayAll);
  });

  // delete timer
  $(document).on("click", ".deleteTimer", function() {
    var value = $(this).parents(".timer").find(".title").text();
    db.deleteTimer(value, account.ID);
    displayTimers();
    // deleteGoalTimer("timers", "name", value, displayTimers);
  });

  $(document).on("click", ".closeMessage", function() {
    clearReact('messages');
  });

  // tries to add a timer or goal to the database, and dispays errors if unsuccessful
  // function addToDatabase(values, display, modalId, titleId, addItem, userID) {
  //   var err = addItem(values[0].toLowerCase().trim(), values[1], values[2], userID);
  //   if (err) {
  //     errorCatch(err, titleId, modalId);
  //   } else {
  //     $(".modal").removeClass('is-active');
  //     display();
  //   }
  // }

  function addToDatabase(values, display, modalId, titleId, addItem, userID) {
    try {
      addItem(values[0].toLowerCase().trim(), values[1], values[2], userID);
      $(".modal").removeClass('is-active');
      display();
    }
    catch (err) {
      errorCatch(err, titleId, modalId)
    }
  }

  function clearReact(id) {
    rd.render(
      null,
      document.getElementById(id)
    );
  }

  // displays modal for adding or editing a goal/timer
  function displayModal(modal, id) {
    rd.render(
      modal,
      document.getElementById('modals')
    );
    $(id).addClass('is-active');
  }

  // function for deleting a goal/timer
  function deleteGoalTimer(table, name, value, display) {
    console.log(value);
    // db.del(value, table, name);

  }

  // function to edit either a goal or a timer
  function editGoalTimer(modalId, values, edit, display, titleId, id) {
    try {
      console.log(values)
      console.log(id)
      edit(values[0], values[1], values[2], id, account.ID);
      $(".modal").removeClass('is-active');
      display();
    }
    catch (err) {
      errorCatch(err, titleId, modalId)
    }
  }

  // display errors on modal submit
  function errorCatch(err, titleId, modalId) {
    if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
      $(titleId).addClass("is-danger");
      $(modalId).find(".errors").text("That title is already in use.");
    } else {
      console.log(err);
    }
  }

  // gets the values from submitting a goal form
  function getGoalForm(id) {
    var formArray = $(id).serializeArray();
    var title = formArray[0]["value"];
    var desc = formArray[1]["value"];
    var reqs = [];
    for (var i = 2; i < formArray.length; i++) {
      reqs.push(formArray[i]["value"]);
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

// TODO: package
// make primary button color but not other buttons, lighter text for inner content, 16 font 1.5 line height, do spacing in multiples, confirm delete, less borders, better date selector, add saturation to greys
// TODO: work on account
// filter goals based on account, filter timers based on account, view goals/timers from all accounts, show the account name next to the goal/timer
// TODO: error when adding account for the first time, edit goal doesn't work, add modal doesn't clear after submitting (use the clearReact function)
// test title name the same on different accounts
// move try catch to dbFunctions
// switch account only one display
// fix complete
