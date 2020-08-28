const react = require('react');
const rd = require('react-dom');
const $ = require('jquery');

$(document).ready(function() {
  //connect to database (JSON file)
  const db = require('electron-db');
  const tableName = "goals";

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

  //updates the parent/require array of an element
  //true for parent, false for requirement
  function updateArray(element, newTitle, type) {
    db.getRows(tableName, {
      title: element
    }, (succ, result) => {
      if (succ) {
        var setArray;
        var set;
        var where = {"title": element}
        if (type) {
          setArray = result[0].parents;
          setArray.push(newTitle);
          set = {"parents": setArray};
        } else {
          setArray = result[0].require;
          setArray.push(newTitle);
          set = {"require": setArray};
        }
        db.updateRow(tableName, where, set, (succ, msg) => {
          console.log(succ);
        });
      }
    });
  }


  //refreshes all elements on the page with updated information after an add/edit call
  function refresh() {
    displayAll();
  }

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
    refresh();
  });

  //edit goal
  $(document).on("click", ".addReqEdit", function() {
    var selection = $(this).siblings(".requireDiv").find("option:selected").val();
    var current = $(this).parents(".goal").find("h1").text();
    updateArray(current, selection, false);
    updateArray(selection, current, true);
    refresh();
  });

  //add currently selected requirement to the list and display on page
  $("#reqButton").click(function() {
    var selection = $("#requireList:first").val();
    $("<p>" + selection + "</p>").appendTo("#currentReqs");
    obj.require.push(selection);
  });

  //add the goal to the database
  $("#skill").click(function() {
    obj.title = $("#skillText").val();
    db.insertTableContent(tableName, obj, (succ, msg) => {
      // succ - boolean, tells if the call is successful
      if (succ) {
        obj.require.forEach(function(element) {
          if (element != "none") {
            updateArray(element, obj.title, true);
          }
        });
        displayAll();
        $("#currentReqs").html("");
        $(".newType").hide();
        $(".addNew").show();
      }
    });
    newObject();
  });
});

const e = react.createElement;

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
