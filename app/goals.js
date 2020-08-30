const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('goals.db');

const e = react.createElement;

$(document).ready(function() {
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS goals (title TEXT, requires TEXT, CONSTRAINT fk_title FOREIGN KEY (title) REFERENCES names(name) ON DELETE CASCADE, CONSTRAINT fk_req FOREIGN KEY (requires) REFERENCES names(name) ON DELETE CASCADE)");
    db.run("CREATE TABLE IF NOT EXISTS names (name TEXT PRIMARY KEY)");
    db.run("PRAGMA foreign_keys = ON");
  });
  //creates a new goal object
  function newObject() {
    var o = new Object();
    o.require = new Array();
    o.parents = new Array();
    return o;
  }

  //display all current goals
  function displayAll() {
    var current = [];
    var future = [];
    var map = new Map();
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
        if (value.length == 1) {
          current.push(e(Goal, {key: key, title: key, reqs: []}, null));
        } else {
          future.push(e(Goal, {key: key, title: key, reqs: value}, null));
        }
      });
      console.log(map);

      rd.render(
        current,
        document.getElementById("currentList")
      );

      rd.render(
    		future,
    		document.getElementById("futureList")
    	);
    });
    db.all("SELECT name FROM names ORDER BY name ASC", function(err, rows) {
      var reqList = [];
      rows.forEach(function(row) {
        reqList.push(e('option', {key: row.name, value: row.name}, row.name));
      });
      rd.render(
        reqList,
        document.getElementById("requireList")
      );
    });
  }

  //current goal being created
  var obj = newObject();
  displayAll();

  //show the goal form after clicking the add button
  $("#add").click(function() {
    $(".addNew").hide();
    $(".newType").show();
  });

  //show edit form
  $(document).on("click", ".editButton", function() {
    $(this).hide();
    $(".requireDiv:first").clone().prependTo($(this).siblings(".editSelect"));
    $(this).siblings(".editSelect").show();
  });

  //delete goal
  $(document).on("click", ".deleteButton", function() {
    var stmt = db.prepare("DELETE FROM names WHERE name == (?)");
    stmt.run($(this).siblings("h1").text());
    stmt.finalize();
    displayAll();
  });

  //edit goal
  $(document).on("click", ".addReqEdit", function() {
    var stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
    stmt.run($(this).parents(".goal").find("h1").text(), $(this).siblings(".requireDiv").find("option:selected").val());
    stmt.finalize();
    displayAll();
  });

  //add currently selected requirement to the list and display on page
  $("#reqButton").click(function() {
    var selection = $("#requireList:first").val();
    $("<p>" + selection + "</p>").appendTo("#currentReqs");
    obj.require.push(selection);
  });

  //add the goal to the database
  $("#skill").click(function() {
    $("#currentReqs").html("");
    $(".newType").hide();
    $(".addNew").show();
    db.serialize(function() {
      var value = $("#skillText").val();
      var stmt = db.prepare("INSERT INTO names VALUES (?)");
      stmt.run(value)
      stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
      stmt.run(value, null);
      if (obj.require.length != 0) {
        stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
        obj.require.forEach(function(element) {
          stmt.run(value, element);
        });
      }
      stmt.finalize();
      displayAll();
      obj = newObject();
    });
  });
});

window.onbeforeunload = function(){
  db.close();
};

class Goal extends react.Component {
  render() {
    var list = [];
    react.Children.map(this.props.reqs, item => {
      list.push(e("li", {key: item}, item));
    });

    return e('div', {className: 'notification is-link is-light goal'},
              e('h1', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
              e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, list),
              e('input', {className: 'editButton button is-danger', type: 'button', value: 'Edit'}, null),
              e('div', {className: "hidden editSelect"},
                  e('input', {className: "addReqEdit button is-danger", type: "button", value: "Confirm Edit"}, null)),
              e('button', {className: "delete deleteButton"}, null)
            );
  }
}
