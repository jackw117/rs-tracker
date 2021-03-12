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

  var account;
  displayAll();

  // displays all current goals and timers and sets the current user
  function displayAll() {
    account = db.getAccountMain();
    // no accounts set as main
    if (!account) {
      var accs = db.getAccounts();
      // sets the first account in the database as main
      if (accs[0]) {
        db.switchAccount(accs[0].ID);
        account = db.getAccountMain();
      }
      // no other accounts in the database, so a user has to create one
      else {
        // show add account modal
        addAccountModal(true);
      }
    } else {
      displayGoals();
      displayTimers();
    }
  }

  // display all current goals
  function displayGoals() {
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
    var rows = db.getTimers(account.ID);
    var done = [];
    rows.forEach(function(row) {
      var d = moment(new Date(row.time)).format("ddd MMM Do [at] HH:mm");
      var u = moment(d, "ddd MMM Do [at] HH:mm").fromNow();
      if (u.includes("ago") && row.done == 0) {
        done.push(row.name);
        db.timerDone(row.name);
      }
      timers.push(e(component.Timer, {key: row.name, title: row.name, time: d, desc: row.desc, until: u, gradient: "to right, #123456, #987654, #147852"}, null));
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


/**************************************** DISPLAY MODALS ****************************************/


  // show add account modal after clicking add account button
  $("#addAccountButton").click(function() {
    addAccountModal(false);
  });

  // function to create the account modal
  function addAccountModal(first) {
    var modal = e(component.AccountModal, {key: "account", type: "account", header: "New Account", first: first});
    displayModal(modal, "#accountModal");
  }

  // show add goal modal after clicking add goal button
  $("#addGoalButton").click(function() {
    var modal = e(component.GoalModal, {key: "goal", type: "goal", header: "New Goal", requirements: requirements, title: "", desc: ""});
    displayModal(modal, "#goalModal");
  });

  // show add timer modal after clicking add timer button
  $("#addTimerButton").click(function() {
    var modal = e(component.TimerModal, {key: "timer", type: "timer", header: "New Timer"});
    displayModal(modal, "#timerModal");
  });

  // show switch account modal after clicking switch account button
  $("#switchAccountButton").click(function() {
    var accounts = db.getAccounts();
    var modal = e(component.SwitchAccountModal, {key: "switchAccount", type: "switchAccount", header: "Switch Accounts", accounts: accounts});
    displayModal(modal, "#switchAccountModal");
  });

  // shows the edit account modal after clicking the button
  $("#editAccountButton").click(function() {
    var modal = e(component.AccountModal, {key: "editAccount", type: "editAccount", header: "Edit Account", title: account.name});
    displayModal(modal, "#editAccountModal");
  });

  // shows edit goal modal after clicking the edit goal button
  $(document).on("click", ".editButton", function() {
    // gets current values to pre-fill the form
    var title = $(this).parents(".goal").find(".title").text();
    var desc = $(this).parents(".goal").find(".desc").text();
    var reqs = [];
    $(this).parents(".goal").find("li").each(function() {
      reqs.push($(this).text());
    });

    // determines which goal requirements should be pre-selected
    var currentTitles = titles.filter(x => x.title != title);
    var currentReqs = [];
    currentTitles.forEach(function(req) {
      var check = reqs.includes(req.title) ? true : false;
      currentReqs.push(e(component.Requirement, {key: req.title, value: req.ID, checked: check, type: "checkbox", name: req.title, label: req.title}));
    });

    var modal = e(component.GoalModal, {key: "editGoal", type: "editGoal", header: "Edit Goal", requirements: currentReqs, title: title, desc: desc});
    displayModal(modal, "#editGoalModal");
  });

  // shows edit timer modal after clicking the edit timer button
  $(document).on("click", ".editTimer", function() {
    // gets current values to pre-fill the form
    var d = moment($(this).parents(".timer").find(".time").text(), "ddd MMM Do [at] HH:mm");
    var date = moment(d).format("yyyy-MM-DD");
    var time = moment(d).format("HH:mm");
    var title = $(this).parents(".timer").find(".title").text();
    var desc = $(this).parents(".timer").find(".desc").text();

    var modal = e(component.TimerModal, {key: "editTimer", type: "editTimer", header: "Edit Timer", title: title, desc: desc, date: date, time: time});
    displayModal(modal, "#editTimerModal");
  });

  // displays the given modal on the page
  function displayModal(modal, id) {
    rd.render(
      modal,
      document.getElementById('modals')
    );
    $(id).addClass('is-active');
  }


/**************************************** MODAL/REACT FUNCTIONS ****************************************/


  // hides modal on a click outside of the modal or on the close modal button
  $(document).on("click", ".modal-background, .closeModal", function() {
    if ($(this).attr('id') != "firstVisit") {
      clearReact('modals');
    }
  });

  // hides the timer done message
  $(document).on("click", ".closeMessage", function() {
    clearReact('messages');
  });

  // handles key presses to work with modals
  $(document).keydown(function(e) {
    // hide the current modal if the user hits the ESC key
    if (e.keyCode == 27) {
      if (account) {
        clearReact('modals');
      }
    }
    // submit the current modal if the user hits the ENTER key
    else if (e.keyCode == 13) {
      e.preventDefault();
      if ($(".modal").is(":visible")) {
        // clicks the save button which triggers the ids on click event
        $(".saveButton").click();
      }
    }
  });

  // changes the state of a requirement button in the edit goal modal to appear clicked/un-clicked
  $(document).on("click", ".reqButton", function() {
    if ($(this).hasClass("is-primary clicked")) {
      $(this).removeClass("is-primary clicked");
    } else {
      $(this).addClass("is-primary clicked");
    }
  });

  // clears the React elements in a given ID
  function clearReact(id) {
    rd.render(
      null,
      document.getElementById(id)
    );
  }


/**************************************** ADD/EDIT ACCOUNTS ****************************************/


  // adds an account after clicking the account modal's save button
  $(document).on("click", "#accountSave", function() {
    var formArray = $("#accountForm").serializeArray();
    var name = formArray[0]["value"];
    var oldID = account ? account.ID : null;
    var err = db.addAccount(name, oldID);
    errorCatch(err, "#accountName", "#accountModal", displayAll);
  });

  // sets the selected account as the main one
  $(document).on("click", "#switchAccountSave", function() {
    var formArray = $("#switchAccountForm").serializeArray();
    var id = formArray[0]["value"];
    db.switchAccount(id);
    errorCatch(null, null, null, displayAll)
  });

  $(document).on("click", "#editAccountSave", function() {
    var formArray = $("#editAccountForm").serializeArray();
    var name = formArray[0]["value"];
    var err = db.editAccount(name, account.ID);
    errorCatch(err, "#accountName", "#editAccountModal", displayAll);
  });


/**************************************** ADD/EDIT GOALS ****************************************/


  // adds the goal to the database after clicking the goal modal's save button
  $(document).on("click", "#goalSave", function() {
    var values = getGoalForm("#goalForm");
    var err = db.addGoal(values["title"], values["desc"], values["reqs"], account.ID);
    errorCatch(err, "#skillText", "#goalModal", displayGoals);
  });

  // edits the goal
  $(document).on("click", "#editGoalSave", function() {
    var values = getGoalForm("#editGoalForm");
    var id = db.getGoalID(values["oldTitle"], account.ID)["ID"];
    var err = db.editGoal(values["title"], values["desc"], values["reqs"], id, account.ID);
    errorCatch(err, "#skillText", "#editGoalModal", displayGoals);
  });

  // gets the values from submitting a goal form
  function getGoalForm(id) {
    var formArray = $(id).serializeArray();
    var title = formArray[0]["value"];
    var desc = formArray[1]["value"];
    var oldTitle = formArray[2]["value"];
    var reqs = [];
    for (var i = 3; i < formArray.length; i++) {
      reqs.push(formArray[i]["value"]);
    }
    return {
      "title": title,
      "desc": desc,
      "oldTitle": oldTitle,
      "reqs": reqs
    };
  }


/**************************************** ADD/EDIT TIMERS ****************************************/


  // adds the timer to the database after clicking the timer modal's save button
  $(document).on("click", "#timerSave", function() {
    var values = getTimerForm("#timerForm");
    var err = db.addTimer(values["title"], values["date"], values["desc"], account.ID);
    errorCatch(err, "#timerTitle", "#timerModal", displayTimers);
  });

  // edits timer
  $(document).on("click", "#editTimerSave", function() {
    var values = getTimerForm("#editTimerForm");
    var id = db.getTimerID(values["oldTitle"], account.ID)["ID"];
    var err = db.editTimer(values["title"], values["date"], values["desc"], id);
    errorCatch(err, "#timerTitle", "#editTimerModal", displayTimers);
  });

  // gets the values from submitting a timer form
  function getTimerForm(id) {
    var formArray = $(id).serializeArray();
    var title = formArray[0]["value"];
    var date = formArray[1]["value"];
    var time = formArray[2]["value"];
    var desc = formArray[3]["value"];
    var oldTitle = formArray[4]["value"];
    return {
      "title": title,
      "date": date + " " + time,
      "desc": desc,
      "oldTitle": oldTitle
    };
  }


/**************************************** ADD/EDIT FUNCTIONS ****************************************/


  // error handling function to be used after adding/editing an item
  function errorCatch(err, titleId, modalId, display) {
    // clears the current modal and calls the passed display function on success
    if (!err) {
      clearReact("modals");
      display();
    }
    // displays an error message on failure
    else {
      if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
        $(titleId).addClass("is-danger");
        $(modalId).find(".errors").text("That title is already in use.");
      }
      console.log(err);
    }
  }


/**************************************** DELETE ITEMS ****************************************/


  // delete goal
  $(document).on("click", ".deleteGoal", function() {
    var value = $(this).parents(".goal").find(".title").text();
    db.deleteGoal(value, account.ID);
    displayGoals();
  });

  // remove the current goal and all its children
  $(document).on("click", '.doneButton', function() {
    var parent = $(this).parents(".card").find(".title").text();
    var deleteList = [parent];
    $(this).parents(".card").find("li").each(function() {
      deleteList.push($(this).text());
    });
    db.complete(parent, deleteList, account.ID);
    displayGoals();
  });

  // delete timer
  $(document).on("click", ".deleteTimer", function() {
    var value = $(this).parents(".timer").find(".title").text();
    db.deleteTimer(value, account.ID);
    displayTimers();
  });

  // delete current account
  $(document).on("click", "#accountDeleteButton", function() {
    db.deleteAccount(account.ID);
    clearReact("modals");
    displayAll();
  });
});

// TODO: package, test?
// make primary button color but not other buttons, lighter text for inner content, 16 font 1.5 line height, do spacing in multiples, confirm delete, less borders, better date selector, add saturation to greys
