const { authenticateToken } = require("../controllers/authController");
var express = require("express");
var router = express.Router();
const pool = require("../db");

router.get("/", authenticateToken, function (req, res, next) {
  pool.connect((err, client, done) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to connect to the database" });
    }

    // Execute the query to retrieve all users
    client.query("SELECT * FROM users", (err, result) => {
      done(); // Release the client back to the pool

      if (err) {
        return res.status(500).json({ error: "Failed to retrieve users" });
      }

      // Extract the user data from the query result
      const users = result.rows;

      // Send the users as a JSON response
      res.json(users);
    });
  });
});

module.exports = router
