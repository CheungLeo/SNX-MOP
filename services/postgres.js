/*
  * This module sets up a connection pool to a PostgreSQL database to store verified phone numbers.
*/
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;