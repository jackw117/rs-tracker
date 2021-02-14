// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('goals.db');
const Database = require('better-sqlite3');
const db = new Database('goals.db');

// adds a goal to the database
function add(title, desc, reqs, cb) {
  const stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
  stmt.run(title, desc);
  const reqStmt = db.prepare("INSERT INTO reqs VALUES (?, ?)");
  reqs.forEach(function(req) {
    reqStmt.run(title, req);
  });
  cb();
}

// adds a timer to the database
function addTimer(title, date, cb) {
  const stmt = db.prepare("INSERT INTO timers VALUES (?, ?)");
  stmt.run(title, date);
  cb();
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
  const goals = db.prepare("CREATE TABLE IF NOT EXISTS goals (title TEXT PRIMARY KEY, desc TEXT)");
  goals.run();
  const reqs = db.prepare("CREATE TABLE IF NOT EXISTS reqs (parent TEXT, child TEXT, FOREIGN KEY (parent) REFERENCES goals(title) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (child) REFERENCES goals(title) ON DELETE CASCADE ON UPDATE CASCADE)");
  reqs.run();
  const timers = db.prepare("CREATE TABLE IF NOT EXISTS timers (name TEXT PRIMARY KEY, time TEXT)");
  timers.run();
  db.pragma("foreign_keys = ON");
}

// deletes either a goal or a timer from the corresponding table
function del(value, table, name, cb) {
  const stmt = db.prepare("DELETE FROM " + table + " WHERE " + name + " == (?)");
  stmt.run(value);
  if (cb) {
    cb();
  }
}

// updates the given columns in a goal
function editGoal(desc, title, old, reqs, cb) {
  const updateStmt = db.prepare("UPDATE goals SET desc = (?), title = (?) WHERE title == (?)");
  updateStmt.run(desc, title, old);
  const delStmt = db.prepare("DELETE FROM reqs WHERE parent == (?)");
  delStmt.run(title);
  const insertStmt = db.prepare("INSERT INTO reqs VALUES (?, ?)");
  reqs.forEach(function(req) {
    insertStmt.run(title, req);
  });
  cb();
}

// edits the time field of a timer
function editTimer(title, time, cb) {
  const stmt = db.prepare("UPDATE timers SET time = (?) WHERE name == (?)");
  stmt.run(time, title);
  cb();
}

function getGoals() {
  const stmt = db.prepare("SELECT title, desc FROM goals ORDER BY title ASC");
  const rows = stmt.all();
  return rows;
}

function getTimers() {
  const stmt = db.prepare("SELECT name, time FROM timers");
  const rows = stmt.all();
  return rows;
}

function getReqs() {
  const stmt = db.prepare("SELECT parent, child FROM reqs");
  const rows = stmt.all();
  return rows;
}

module.exports = {add: add, del: del, complete: complete, addTimer: addTimer, editTimer: editTimer, create: create, editGoal: editGoal, getGoals: getGoals, getReqs: getReqs, getTimers: getTimers};
