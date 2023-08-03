import { Database } from "sqlite3";

let db: Database;
let schema: Record<string, Record<string, string>>;

// Helper function to initialize the database
async function initDB(): Promise<void> {
    db = new Database('db.sqlite')
}

// Function to create a table if it doesn't exist
export async function createTableIfNotExists(collection: string): Promise<void> {
    if (!db) {
        await initDB();
    }
    const sql = `CREATE TABLE IF NOT EXISTS ${collection} (id INTEGER PRIMARY KEY, data TEXT)`;
    db.exec(sql);
}

export async function recreateTables(): Promise<void> {
    if (!db) {
        await initDB();
    }
    schema = require('./schema.json');
  
    for (const [collection, value] of Object.entries(schema)) {
        const dropSql = `DROP TABLE IF EXISTS ${collection}`;
        await db.exec(dropSql);

        const columnDefinitions = Object.entries(value)
        .map(([columnName, columnType]) => `${columnName} ${columnType}`)
        .join(', ');

        const createSql = `CREATE TABLE ${collection} (id INTEGER PRIMARY KEY, ${columnDefinitions})`;
        await db.exec(createSql);
    }
}
export async function read(collection: string, id: string): Promise<any | undefined> {
    if (!db) {
        await initDB();
    }
    const sql = `SELECT * FROM ${collection} WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.get(sql, id, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    })
}

export async function create(collection: string, data: any): Promise<any> {
    if (!db) {
        await initDB();
    }
    if (!schema[collection]) {
        throw new Error(`Collection "${collection}" not found in the schema.`);
    }
  
    const columns = schema[collection];
    const columnNames = Object.keys(columns);

    const placeholders = columnNames.map(() => '?').join(', ');
    const values = columnNames.map((columnName) => data[columnName]);
  
    const sql = `INSERT INTO ${collection} (${columnNames.join(', ')}) VALUES (${placeholders})`;
    
    return new Promise((resolve, reject) => {
        const statement = db.prepare(sql);
        statement.run(values, function (err) {
        if (err) {
            reject(err);
        } else {
            resolve(this.lastID);
        }
        statement.finalize();
        });
    });
  }

export async function update(collection: string, id: string, data: any): Promise<any | undefined> {
    if (!db) {
        await initDB();
    }
  
    if (!schema[collection]) {
        throw new Error(`Collection "${collection}" not found in the schema.`);
    }
  
    const columns = schema[collection];
    const columnNames = Object.keys(columns);
    const setValues = columnNames.map((columnName) => `${columnName} = ?`).join(', ');
    const values = columnNames.map((columnName) => data[columnName]);
  
    return new Promise((resolve, reject) => {
        const sql = `UPDATE ${collection} SET ${setValues} WHERE id = ?`;
        const statement = db.prepare(sql);
        statement.run([...values, id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
            statement.finalize();
        });
    });
  }

export async function del(collection: string, id: string): Promise<boolean> {
    if (!db) {
        await initDB();
    }
    const sql = `DELETE FROM ${collection} WHERE id = ?`;
    return new Promise((resolve, reject) => {
        const statement = db.prepare(sql);
        statement.run(id, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes > 0);
            }
            statement.finalize();
        });
    });
}
