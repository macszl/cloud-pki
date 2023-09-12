const { authenticateToken } = require("../controllers/authController");
var express = require("express");
var router = express.Router();
const pool = require("../db");
var bcrypt = require("bcryptjs");

router.post("/", authenticateToken, function (req, res, next) {
    //Execute SQL command from request body
    const sqlCommand = req.body.sqlCommand;
    console.log(sqlCommand)
    pool.connect((err, client, done) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to connect to the database" });
      }
      
      // Execute the query to retrieve database name
      client.query(`${sqlCommand}`, (err, result) => {
        if (err) {
          done();
          
          const errorMessage = err.message; // Get the error message
          console.error(errorMessage);

          return res.status(400).json({ error: errorMessage });
        }

        //Log the result of the sql command to the console
        console.log(result);

        // Send the result as a JSON response
        res.json(result.rows);
        done()
      });
    });
  });

module.exports = router;