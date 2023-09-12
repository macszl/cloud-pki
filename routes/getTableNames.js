const { authenticateToken } = require("../controllers/authController");
var express = require("express");
var router = express.Router();
const pool = require("../db");
var bcrypt = require("bcryptjs");


router.get("/", authenticateToken, (req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(500).json({ error: "Failed to connect to the database" });
    }

    // You might want to adjust the query based on what you mean by "database details."
    client.query(
      `SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema = 'public'`,
      (err, result) => {
        done(); // Release the client back to the pool

        if (err) {
          const errorMessage = err.message; // Get the error message
          console.error(errorMessage);

          return res.status(400).json({ error: errorMessage });
        }

        if ( result.rows.length == 0 ) {
          return res.status(500).json({ error: "No tables found" });
        }

        // Extract the table names from the query result
        const tableNames = result.rows.map((row) => row.table_name);
        console.log(tableNames)
        // Send the table names as a JSON response
        res.json({ tableNames });
      }
    );
  });
});

module.exports = router;





