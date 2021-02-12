const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('goals.db');

// adds a goal to the database
function add(title, desc, reqs, cb) {
  var stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
  stmt.run(title, desc, function(e) {
    if (e) {
      console.log(e);
      alert("Failed to add goal. New goals must have a unique name.");
    } else {
      // adds to the reqs table if necessary
      if (reqs.length != 0) {
        stmt = db.prepare("INSERT INTO reqs VALUES (?, ?)");
        reqs.forEach(function(req) {
          stmt.run(title, req);
        });
      }
      cb();
    }
  });
  stmt.finalize();
}

// adds a timer to the database
function addTimer(title, date, cb) {
  var stmt = db.prepare("INSERT INTO timers VALUES (?, ?)");
  stmt.run(title, date, function(e) {
    cb();
  });
  stmt.finalize();
}

// removes the given goal and each requirement associated with it
function complete(parent, reqs, cb) {
  reqs.forEach(function(req) {
    del(req, "goals", "title", null);
  });
  del(parent, "reqs", "parent", null);
  del(parent, "goals", "title", cb);
}

// creates the database if it doesn't already exist
function create() {
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS goals (title TEXT PRIMARY KEY, desc TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS reqs (parent TEXT, child TEXT, FOREIGN KEY (parent) REFERENCES goals(title) ON DELETE CASCADE, FOREIGN KEY (child) REFERENCES goals(title) ON DELETE CASCADE)");
    db.run("CREATE TABLE IF NOT EXISTS timers (name TEXT PRIMARY KEY, time TEXT)");
    db.run("PRAGMA foreign_keys = ON");
  });
}

// deletes either a goal or a timer from the corresponding table
function del(value, table, name, cb) {
  var stmt = db.prepare("DELETE FROM " + table + " WHERE " + name + " == (?)");
  stmt.run(value, function(e) {
    if (cb) {
      cb();
    }
  });
  stmt.finalize();
}

// updates the given columns in a goal
function editGoal(desc, title, cb) {
  var stmt = db.prepare("UPDATE goals SET desc = (?) WHERE title == (?)");
  stmt.run(desc, title, function(e) {
    if (e) {
      console.log(e);
    } else {
      cb();
    }
  });
  stmt.finalize();
}

// edits the time field of a timer
function editTimer(title, time, cb) {
  var stmt = db.prepare("UPDATE timers SET time = (?) WHERE name == (?)");
  stmt.run(time, title, function(e) {
    cb();
  });
  stmt.finalize();
}

// removes an entry from the reqs table
function remove(parent, child, cb) {
  var stmt = db.prepare("DELETE FROM reqs WHERE parent == (?) AND child == (?)");
  stmt.run(parent, child, function(e) {
    cb();
  });
  stmt.finalize();
}

module.exports = {add: add, del: del, remove: remove, complete: complete, addTimer: addTimer, editTimer: editTimer, create: create, editGoal: editGoal};
