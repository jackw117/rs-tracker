const Database = require('better-sqlite3');
const db = new Database('goals.db');

// adds a goal to the database
function add(title, desc, reqs) {
  const stmt = db.prepare("INSERT INTO goals VALUES (?, ?)");
  stmt.run(title, desc);
  const reqStmt = db.prepare("INSERT INTO reqs VALUES (?, ?)");
  reqs.forEach(function(req) {
    reqStmt.run(title, req);
  });
}

// adds a timer to the database
function addTimer(title, date, desc) {
  const stmt = db.prepare("INSERT INTO timers VALUES (?, ?, ?, ?)");
  stmt.run(title, date, desc, 0);
}

// removes the given goal and each requirement associated with it
function complete(parent, reqs) {
  reqs.forEach(function(req) {
    del(req, "goals", "title");
  });
  del(parent, "reqs", "parent");
  del(parent, "goals", "title");
}

// creates the database if it doesn't already exist
function create() {
  const goals = db.prepare("CREATE TABLE IF NOT EXISTS goals (title TEXT PRIMARY KEY, desc TEXT)");
  goals.run();
  const reqs = db.prepare("CREATE TABLE IF NOT EXISTS reqs (parent TEXT, child TEXT, FOREIGN KEY (parent) REFERENCES goals(title) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (child) REFERENCES goals(title) ON DELETE CASCADE ON UPDATE CASCADE)");
  reqs.run();
  const timers = db.prepare("CREATE TABLE IF NOT EXISTS timers (name TEXT PRIMARY KEY, time TEXT, desc TEXT, done INTEGER)");
  timers.run();
  db.pragma("foreign_keys = ON");
}

// deletes either a goal or a timer from the corresponding table
function del(value, table, name) {
  const stmt = db.prepare("DELETE FROM " + table + " WHERE " + name + " == (?)");
  stmt.run(value);
}

// updates the given columns in a goal
function editGoal(title, desc, reqs, old) {
  const updateStmt = db.prepare("UPDATE goals SET desc = (?), title = (?) WHERE title == (?)");
  updateStmt.run(desc, title, old);
  const delStmt = db.prepare("DELETE FROM reqs WHERE parent == (?)");
  delStmt.run(title);
  const insertStmt = db.prepare("INSERT INTO reqs VALUES (?, ?)");
  reqs.forEach(function(req) {
    insertStmt.run(title, req);
  });
}

// edits the time field of a timer
function editTimer(title, time, desc, old) {
  const stmt = db.prepare("UPDATE timers SET name = (?), time = (?), desc = (?), done = 0 WHERE name == (?)");
  stmt.run(title, time, desc, old);
}

function getGoals() {
  const stmt = db.prepare("SELECT * FROM goals ORDER BY title ASC");
  const rows = stmt.all();
  return rows;
}

function getTimers() {
  const stmt = db.prepare("SELECT * FROM timers");
  const rows = stmt.all();
  return rows;
}

function getReqs() {
  const stmt = db.prepare("SELECT * FROM reqs");
  const rows = stmt.all();
  return rows;
}

function timerDone(name) {
  const stmt = db.prepare("UPDATE timers SET done = 1 WHERE name == (?)");
  stmt.run(name);
}

module.exports = {add: add, del: del, complete: complete, addTimer: addTimer, editTimer: editTimer, create: create, editGoal: editGoal, getGoals: getGoals, getReqs: getReqs, getTimers: getTimers, timerDone: timerDone};
