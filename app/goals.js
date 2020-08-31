const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('goals.db');
const moment = require('moment')

const e = react.createElement;

$(document).ready(function() {
  //creates the database if it doesn't already exist
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS goals (title TEXT, requires TEXT, CONSTRAINT fk_title FOREIGN KEY (title) REFERENCES names(name) ON DELETE CASCADE, CONSTRAINT fk_req FOREIGN KEY (requires) REFERENCES names(name) ON DELETE CASCADE)");
    db.run("CREATE TABLE IF NOT EXISTS names (name TEXT PRIMARY KEY)");
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
    var map = new Map();

    db.serialize(function() {
      db.all("SELECT name FROM names ORDER BY name ASC", function(err, rows) {
        rows.forEach(function(row) {
          reqList.push(e('option', {key: row.name, value: row.name}, row.name));
        });
        rd.render(
          reqList,
          document.getElementById("requireList")
        );
      });

      db.all("SELECT title, requires FROM goals ORDER BY title ASC", function(err, rows) {
        rows.forEach(function(row) {
          if (map.has(row.title)) {
            var temp = map.get(row.title);
            temp.push(row.requires);
            map.set(row.title, temp);
          } else {
            map.set(row.title, [row.requires]);
          }
        });
        map.forEach(function(value, key) {
          var reqList2 = reqList.filter(i => i.key !== key && !(value.includes(i.key)) && !map.get(i.key).includes(key));
          if (value.length == 1) {
            current.push(e(Goal, {key: key, title: key, reqs: [], select: reqList2}, null));
          } else {
            future.push(e(Goal, {key: key, title: key, reqs: value.slice(1), select: reqList2}, null));
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
      });


    });
    obj = newObject();
    obj.reqList = reqList;
  }

  function displayTimers() {
    var timers = [];
    db.all("SELECT name, time FROM timers", function(err, rows) {
      rows.forEach(function(row) {
        timers.push(e(Timer, {key: row.name, title: row.name, time: row.time}, null));
      });

      console.log(timers);
      timers = timers.filter(i => i != null);
      rd.render(
        timers,
        document.getElementById("timerList")
      );
    });
  }

  //current goal being created
  var obj;
  displayAll();
  displayTimers();

  //show the goal form after clicking the add button
  $("#add").click(function() {
    $("#add").hide();
    $(".newType").show();
    if (obj.reqList.length != 0) {
      $("#addReqDiv").show();
    } else {
      $("#addReqDiv").hide();
    }
    $("#skillText").val("");
  });

  //cancels adding a new goal to the datbase
  $("#cancel").click(function() {
    $("#add").show();
    $(".newType").hide();
    $("#currentReqs").html("");
    displayAll();
  });

  //show edit form
  $(document).on("click", ".editButton", function() {
    $(this).hide();
    $(this).siblings(".reqList").find("input").show();
    $(this).siblings(".editSelect").show();
  });

  //delete goal
  $(document).on("click", ".deleteButton", function() {
    var stmt = db.prepare("DELETE FROM names WHERE name == (?)");
    stmt.run($(this).siblings("h2").text());
    stmt.finalize();
    displayAll();
  });

  //add requirement to goal
  $(document).on("click", ".addReqEdit", function() {
    var stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
    stmt.run($(this).parents(".goal").find("h2").text(), $(this).siblings(".requireDiv").find("option:selected").val());
    stmt.finalize();
    displayAll();
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
    var stmt = db.prepare("DELETE FROM goals WHERE requires == (?)");
    stmt.run($(this).parents("li").text());
    stmt.finalize();
    displayAll();
  });

  //cancels editing the goal
  $(document).on("click", ".cancelButton", function() {
    $(this).parents(".editSelect").hide();
    $(this).parents(".notification").find(".removeButton").hide();
    $(this).parents(".notification").find(".editButton").show();
  });

  //add the goal to the database
  $("#skill").click(function() {
    $("#currentReqs").html("");
    $(".newType").hide();
    $("#add").show();
    var stmt;
    db.serialize(function() {
      var value = $("#skillText").val();
      stmt = db.prepare("INSERT INTO names VALUES (?)");
      stmt.run(value, function(e) {
        if (e) {
          console.log(e);
          alert("Failed to add goal. New goals must have a unique name.");
        } else {
          stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
          stmt.run(value, null);
          if (obj.require.length != 0) {
            stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
            obj.require.forEach(function(element) {
              stmt.run(value, element);
            });
          }
          displayAll();
        }
      });
      stmt.finalize();
    });
  });

  $("#timerButton").click(function() {
    var stmt = db.prepare("INSERT INTO timers VALUES (?, ?)");
    stmt.run($("#timerTitle").val(), $("#timerDate").val() + " " + $("#timerTime").val());
    stmt.finalize();
    $("#timerTitle").val("");
    $("#timerDate").val("");
    $("#timerTime").val("");
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
  }, 900000);
});

class Goal extends react.Component {
  render() {
    var list = [];
    react.Children.map(this.props.reqs, item => {
      list.push(e("li", {key: item},
        item, e('input', {className: "removeButton hidden", type: "button", value: "Remove requirement"}, null)
      ));
    });
    var select = this.props.select.length != 0 ?
      [e('div', {className: "requireDiv select is-primary", key: "div"}, e('select', {name: "require"}, this.props.select)),
      e('input', {className: "addReqEdit button is-danger", type: "button", value: "Confirm Edit", key: "input"}, null)]
      : null;

    return e('div', {className: 'notification is-link is-light goal'},
             e('h2', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
             e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, list),
               e('input', {className: 'editButton button is-danger', type: 'button', value: 'Edit'}, null),
               e('div', {className: "hidden editSelect"},
                 select,
                 e('input', {className: "cancelButton button is-danger", type: "button", value: "Cancel"}, null)
                ),
               e('button', {className: "delete deleteButton hidden"}, null)
            );
  }
}

class Timer extends react.Component {
  render() {
    var d = moment(new Date(this.props.time)).format("ddd MMM Do [at] HH:mm");
    var u = moment(d, "ddd MMM Do [at] HH:mm").fromNow();

    return e('div', {className: 'notification is-link is-light timer'},
              e('h2', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
              e('p', {className: 'subtitle is-size-6 time'}, d.toString()),
              e('p', {className: 'subtitle is-size-6 until'}, u.toString())
            );
  }
}

// work on timers
// data checks for timers
// display goals with more reqs lower on list (done)
