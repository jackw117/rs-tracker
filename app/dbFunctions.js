const Database = require('better-sqlite3');
const db = new Database('goals.db');

function addAccount(name) {
  // sets the newest added account as the main account and sets main to false on the previous main account
  removeMain();
  const stmt = db.prepare("INSERT INTO accounts (name, main) VALUES (?, 1)");
  stmt.run(name);
}

// adds a goal to the database
function addGoal(title, desc, reqs, userID) {
  // try {
  //   const stmt = db.prepare("INSERT INTO goals (title, desc, userID) VALUES (?, ?, ?)");
  //   const info = stmt.run(title, desc, userID);
  //   const parentID = info.lastInsertRowid;
  //   const reqStmt = db.prepare("INSERT INTO reqs (parentID, childID, userID) VALUES (?, ?, ?)");
  //   reqs.forEach(function(req) {
  //     reqStmt.run(parentID, req, userID);
  //   });
  // } catch (err) {
  //   return err;
  // }
  const stmt = db.prepare("INSERT INTO goals (title, desc, userID) VALUES (?, ?, ?)");
  const info = stmt.run(title, desc, userID);
  const parentID = info.lastInsertRowid;
  const reqStmt = db.prepare("INSERT INTO reqs (parentID, childID, userID) VALUES (?, ?, ?)");
  reqs.forEach(function(req) {
    reqStmt.run(parentID, req, userID);
  });
}

// adds a timer to the database
function addTimer(title, date, desc, userID) {
  const stmt = db.prepare("INSERT INTO timers (name, time, desc, done, userID) VALUES (?, ?, ?, ?, ?)");
  stmt.run(title, date, desc, 0, userID);
}

// removes the given goal and each requirement associated with it
function complete(parent, deleteList, id) {
  deleteList.forEach(function(item) {
    deleteGoal(item, id);
  });
}

// creates the database if it doesn't already exist
function create() {
  const goals = db.prepare("CREATE TABLE IF NOT EXISTS goals (ID INTEGER PRIMARY KEY, title TEXT, desc TEXT, userID INTEGER, FOREIGN KEY (userID) REFERENCES accounts(ID) ON DELETE CASCADE ON UPDATE CASCADE, UNIQUE (title, userID))");
  goals.run();
  const reqs = db.prepare("CREATE TABLE IF NOT EXISTS reqs (parentID INTEGER, childID INTEGER, userID INTEGER, FOREIGN KEY (parentID) REFERENCES goals(ID) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (childID) REFERENCES goals(ID) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (userID) REFERENCES accounts(ID) ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY (parentID, childID))");
  reqs.run();
  const timers = db.prepare("CREATE TABLE IF NOT EXISTS timers (ID INTEGER PRIMARY KEY, name TEXT, time TEXT, desc TEXT, done INTEGER, userID INTEGER, FOREIGN KEY (userID) REFERENCES accounts(ID) ON DELETE CASCADE ON UPDATE CASCADE)");
  timers.run();
  const account = db.prepare("CREATE TABLE IF NOT EXISTS accounts (ID INTEGER PRIMARY KEY, name TEXT, main INTEGER, UNIQUE (name))");
  account.run();
  db.pragma("foreign_keys = ON");
}

function deleteGoal(title, id) {
  const stmt = db.prepare("DELETE FROM goals WHERE title = (?) AND userID = (?)");
  stmt.run(title, id);
}

function deleteTimer(name, id) {
  const stmt = db.prepare("DELETE FROM timers WHERE name = (?) AND userID = (?)");
  stmt.run(name, id);
}

function editAccount(name, main) {
  if (main == 1) {
    removeMain();
  }
  const stmt = db.prepare("UPDATE accounts SET name = (?), main = (?) WHERE name = (?)");
  stmt.run(name, main, name);
}

// updates the given columns in a goal
function editGoal(title, desc, reqs, id, userID) {
  const updateStmt = db.prepare("UPDATE goals SET desc = (?), title = (?) WHERE ID = (?)");
  updateStmt.run(desc, title, id);
  const delStmt = db.prepare("DELETE FROM reqs WHERE parentID = (?)");
  delStmt.run(id);
  const insertStmt = db.prepare("INSERT INTO reqs VALUES (?, ?, ?)");
  reqs.forEach(function(req) {
    insertStmt.run(id, req, userID);
  });
}

// edits the time field of a timer
function editTimer(title, time, desc, id) {
  const stmt = db.prepare("UPDATE timers SET name = (?), time = (?), desc = (?), done = 0 WHERE ID == (?)");
  stmt.run(title, time, desc, id);
}

function getAccountMain() {
  const stmt = db.prepare("SELECT * FROM accounts WHERE main = 1");
  const name = stmt.get();
  return name;
}

function getAccounts() {
  return getAll("SELECT * FROM accounts ORDER BY name ASC")
}

function getGoalID(title, userID) {
  const stmt = db.prepare("SELECT ID FROM goals WHERE title = (?) AND userID = (?)");
  const id = stmt.get(title, userID);
  return id;
}

function getGoals(userID) {
  return getAll("SELECT * FROM goals WHERE userID = (?) ORDER BY title ASC", userID);
}

function getReqs(userID) {
  return getAll("SELECT g.title AS 'parent', g2.title AS 'child' FROM reqs r LEFT JOIN goals g ON g.ID = r.parentID LEFT JOIN goals g2 ON g2.ID = r.childID WHERE r.userID = (?)", userID)
}

function getTimerID(name, userID) {
  console.log(name + " " + userID)
  const stmt = db.prepare("SELECT ID FROM timers WHERE name = (?) AND userID = (?)");
  const id = stmt.get(name, userID);
  return id;
}

function getTimers() {
  return getAll("SELECT * FROM timers");
}

function getAll(sql, where) {
  const stmt = db.prepare(sql);
  if (where) {
    return stmt.all(where);
  } else {
    return stmt.all();
  }
}

function removeMain() {
  const stmt = db.prepare("UPDATE accounts SET main = 0 WHERE main = 1");
  stmt.run();
}

function timerDone(name) {
  const stmt = db.prepare("UPDATE timers SET done = 1 WHERE name == (?)");
  stmt.run(name);
}

module.exports = {addGoal: addGoal, addAccount: addAccount, deleteGoal: deleteGoal, deleteTimer: deleteTimer, complete: complete, addTimer: addTimer, editAccount: editAccount, editTimer: editTimer, create: create, editGoal: editGoal, getAccountMain: getAccountMain, getAccounts: getAccounts, getGoalID: getGoalID, getGoals: getGoals, getReqs: getReqs, getTimerID: getTimerID, getTimers: getTimers, timerDone: timerDone};
