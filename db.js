const { Pool } = require("pg");
require("dotenv").config();

const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});


module.exports = pool;
