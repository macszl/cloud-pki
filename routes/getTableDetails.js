const { authenticateToken } = require("../controllers/authController");
var express = require("express");
var router = express.Router();
const pool = require("../db");
var bcrypt = require("bcryptjs");


router.get("/:name", authenticateToken, function (req, res, next) {
    //Get table details from request body
    const tableName = req.params.name;

    pool.connect((err, client, done) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to connect to the database" });
      }
  
      // Execute the query to retrieve database details
      client.query(`SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${tableName}'`, (err, result) => {
        done()
        if (err) {
          const errorMessage = err.message; // Get the error message
          console.error(errorMessage);

          return res.status(400).json({ error: errorMessage });
        }
  
        // Extract the database details from the query result
        if (result.rows.length == 0) {
            return res.status(500).json({ error: "No table with the name " });
        }
        
        const tableDetails = result.rows;
        console.log(tableDetails)
        // Send the database as a JSON response
        res.json(tableDetails);
      });
    });
  });

module.exports = router;