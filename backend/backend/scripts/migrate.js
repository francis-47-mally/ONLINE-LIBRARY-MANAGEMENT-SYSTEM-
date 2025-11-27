const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', '..', 'olms.sqlite');
const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');
const db = new Database(dbPath);
db.exec(schema);
console.log('Database migrated at', dbPath);
