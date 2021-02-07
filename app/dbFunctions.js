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

// adds an entry to the reqs table
function addReq(parent, child, cb) {
  var stmt = db.prepare("INSERT INTO reqs VALUES (?, ?)");
  stmt.run(parent, child, function(e) {
    cb();
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

module.exports = {add: add, del: del, remove: remove, addReq: addReq, complete: complete, addTimer: addTimer, editTimer: editTimer};
