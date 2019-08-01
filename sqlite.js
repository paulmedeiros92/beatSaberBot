const sqlite3 = require('sqlite3').verbose();
let db = {};

exports.songs = [];

exports.openDB = function (path) {
    // open database in memory
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(path, (err) => {
            if (err) {
                reject(err.message);
            } else {
                console.log('Connected to the in-memory SQlite database.');
                resolve(true);
            }
        });
    });
}

exports.getUser = function (username) {
    let query = `SELECT * FROM users WHERE username = ?`;
    return new Promise((resolve, reject) => {
        db.get(query, [username], (err, row) => {
            if(err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

exports.getUsers = function (username) {
    let query = `SELECT * FROM users ORDER BY id ASC`;
    return new Promise((resolve, reject) => {
        db.get(query, [username], (err, row) => {
            if(err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

exports.getSongs = function (callback) {
    let query = `SELECT * FROM songs ORDER BY id ASC`;
    db.all(query,(err, rows) => {
        callback(rows);
    });
}

exports.insertSong = function (id, name) {
    let query = `INSERT INTO songs (id, name) VALUES (?,?)`;
    allQuery(query, [id,name]);
}

exports.insertScore = function (score, userID, songID) {
    const params = [score, userID, songID];
    const get = `SELECT * FROM scores WHERE userID = ? AND songID = ?`;
    db.get(get, [userID, songID], (err, row) => {
        //insert or update
        const query =  row !== undefined ? 'UPDATE scores SET score = ? WHERE userID = ? AND songID = ?' :
            'INSERT INTO scores (score, userID, songID) VALUES (?, ?, ?)';
        allQuery(query, params);
    });
}

exports.getScore = function (userID, songID) {
    let query = `SELECT * FROM scores WHERE userID = ? AND songID = ?`;
    db.get(query, [userID, songID], (err, row) => {
        if (err) {
            return false;
        }
        else {
            return row;
        }
    });
}

exports.getAllUserScores = function (userID) {
    let query = `SELECT * FROM scores WHERE userID = ?`;
    return new Promise((resolve, reject) => {
        db.all(query, userID, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

exports.closeDB = function() {
    // close the database connection
    db.close((err) => {
        if (err) {
        return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}

function allQuery(query, params) {
    db.all(query, params, (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row.name);
        });
    });
}