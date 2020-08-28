

$(document).ready(function() {
  //connect to database (JSON file)
  const db = require('electron-db');
  const tableName = "goals";

  //creates the goals table if it doesn't already exist
  db.createTable(tableName, (succ, msg) => {});

  //current goal being created
  var obj;

  //creates a new goal object
  function newObject() {
    obj = new Object();
    obj.require = new Array();
    obj.parents = new Array();
  }

  newObject();

  //display all current goals
  function displayAll() {
    db.getAll(tableName, (succ, data) => {
      data.forEach(function(element) {
        appendToDatabase(element);
      });
    });
  }

  displayAll();

  //adds a goal to the page
  function appendToDatabase(element) {
    var reqs = "<ul class='reqList subtitle is-size-6 is-uppercase'>";
    element.require.forEach((item, i) => {
      reqs = reqs + "<li>" + item + "</li>";
    });
    addRequirements(element, ".requireList");

    var databaseName;
    if (reqs.includes("<li>")) {
      databaseName = "#futureList"
    } else {
      databaseName = "#currentList"
    }
    reqs = reqs + "</ul>";
    var title = "<p>" + element.title + "</p>";
    var edit = "<input type='button' class='editButton button is-danger' value='Edit'>";
    var select = "<div style='display:none;' class='editSelect'><input type='button' value='Confirm Edit' class='addReqEdit button is-danger'></div>";
    var deleteButton = "<button class='delete deleteButton'></button>";
    $("<div class='notification is-link is-light goal'>" +
        "<h1 class='title is-uppercase is-size-5'>" + title + "</h1>"
        + reqs + edit + select + deleteButton + "</div>").appendTo(databaseName);

  }

  //add new goal to requirements form field
  function addRequirements(element, where) {
    $("<option value='"+element.title+"'>"+element.title+"</option>").appendTo(where + ":first");
  }

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
          console.log(result);
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
    $("#currentList").html("");
    $("#futureList").html("");
    $(".requireList:first").html("");
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
          element = jQuery.grep(element, function(value) {
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
    console.log(selection);
    var current = $(this).parents(".goal").find("h1").text();
    console.log(current);
    $("<li>" + selection + "</li>").appendTo($(this).parent(".goal").find(".reqList"));
    updateArray(current, selection, false);
    updateArray(selection, current, true);
    refresh();
  });

  //add currently selected requirement to the list and display on page
  $("#reqButton").click(function() {
    var selection = $(".requireList:first").val();
    $("<p>" + selection + "</p>").appendTo("#currentReqs");
    obj.require.push(selection);
  });

  //add the goal to the database
  $("#skill").click(function() {
    obj.title = $("#skillText").val();
    db.insertTableContent(tableName, obj, (succ, msg) => {
      // succ - boolean, tells if the call is successful
      if (succ) {
        appendToDatabase(obj);
        obj.require.forEach(function(element) {
          if (element != "none") {
            updateArray(element, obj.title, true);
          }
        });
        $("#currentReqs").html("");
      }
    });
    newObject();
  });

  function displayAll2() {
    var list = new Array();
    db.getAll(tableName, (succ, data) => {
      data.forEach(function(element) {
        list.push(e(Goal, {title: element.title, reqs: element.require}, null));
      });
    });
    return list;
  }

  ReactDOM.render(
  		displayAll2(),
  		document.getElementById("reactList")
  	);
});

const e = React.createElement;

class Goal extends React.Component {
  render() {

    return e('div', {className: 'notification is-link is-light goal'},
              e('h1', {className: 'title is-uppercase is-size-5'}, `${this.props.title}`),
              e('ul', {className: 'reqList subtitle is-size-6 is-uppercase'}, null)
            );
  }
}

// function Goal(props) {
//   return (
//     <div className='notification is-link is-light goal'>
//       <h1 className='title is-uppercase is-size-5'>{props.title}</h1>
//     </div>
//   );
// }
