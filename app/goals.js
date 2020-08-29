const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');
const db = require('electron-db');
var sqlite3 = require('sqlite3').verbose();
var db2 = new sqlite3.Database('goals.db');

const e = react.createElement;

$(document).ready(function() {
  //connect to database (JSON file)
  const tableName = "goals";

  db2.serialize(function() {
    db2.run("CREATE TABLE IF NOT EXISTS goals (title TEXT, requires TEXT)");

    // db2.each("SELECT nameid AS id, name FROM names", function(err, row) {
    //     console.log(row.id + ": " + row.name);
    // });
    //
    // db2.each("SELECT goalid AS id, title FROM goals", function(err, row) {
    //     console.log(row.id + ": " + row.title);
    // });
  });

  //creates the goals table if it doesn't already exist
  db.createTable(tableName, (succ, msg) => {});

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
    var reqList = [];
    db.getAll(tableName, (succ, data) => {
      data.forEach(function(element) {
        if (element.require.length > 0) {
          future.push(e(Goal, {key: element.title, title: element.title, reqs: element.require}, null));
        } else {
          current.push(e(Goal, {key: element.title, title: element.title, reqs: element.require}, null));
        }
        reqList.push(e('option', {key: element.title, value: element.title}, element.title));
      });
    });

    db2.each("SELECT title, requires FROM goals", function(err, row) {
        console.log(row.title + " : " + row.requires);
    });

    rd.render(
      current,
      document.getElementById("currentList")
    );

    // TODO: sort by number of requirements
    rd.render(
  		future,
  		document.getElementById("futureList")
  	);

    rd.render(
      reqList,
      document.getElementById("requireList")
    );
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

  //remove item from every require/parent array
  function removeField(selection, type) {
    db.getField(tableName, type, (succ, data) => {
      if (succ) {
        data.forEach(function(element, i) {
          element = $.grep(element, function(value) {
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
  $(document).on("click", ".deleteButton", function() {
    var selection = $(this).siblings("h1").text();
    removeField(selection, "require");
    removeField(selection, "parents");
    db.deleteRow(tableName, {"title": selection}, (succ, msg) => {});
    displayAll();
  });

  //edit goal
  $(document).on("click", ".addReqEdit", function() {
    var stmt = db2.prepare("INSERT INTO goals VALUES (?, ?)");
    stmt.run($(this).parents(".goal").find("h1").text(), $(this).siblings(".requireDiv").find("option:selected").val());
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
    var stmt = db2.prepare("INSERT INTO goals VALUES (?, ?)");
    obj.require.forEach(function(element) {
      stmt.run($("#skillText").val(), element);
    });
    displayAll();
    newObject();
  });
});

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
