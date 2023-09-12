const { authenticateToken } = require("../controllers/authController");
var express = require("express");
var router = express.Router();
const pool = require("../db");
var bcrypt = require("bcryptjs");

router.get("/", authenticateToken, function (req, res, next) {
    
    pool.connect((err, client, done) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to connect to the database" });
      }
  
      // Execute the query to retrieve database name
      client.query(`SELECT current_database()`, (err, result) => {
        if (err) {
          done();
          const errorMessage = err.message; // Get the error message
          console.error(errorMessage);

          return res.status(400).json({ error: errorMessage });
        }

        console.log(result.rows[0].current_database);
        done()

        return res.status(200).send({
          name: result.rows[0].current_database,
        });
        
      });
    });
  });

module.exports = router;