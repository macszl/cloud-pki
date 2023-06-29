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

router.delete("/:id", authenticateToken, function (req, res, next) {
    const id = req.params.id;
    console.log(id);
    pool.connect((err, client, done) => {
        if (err) {
            return res.status(500).json({ error: "Failed to connect to the database" });
        }
        client.query("DELETE FROM users WHERE id = $1", [id], (err, result) => {
            done();
            if (err) {
                return res.status(500).json({ error: "Failed to delete user" });
            }
            res.status(200).json({ message: "User deleted successfully!" });
        });
      }
    );  
  }
);


router.post("/", authenticateToken, async function (req, res, next) {
  const { id, name, joined, lastVisit, counter, password } = req.body;
  console.log(req.body);
  console.log(id, name, joined, lastVisit, counter, password);
  const hashedPass = await bcrypt.hash(password, 10);
  
  const isoJoined = new Date(joined).toISOString();
  const isoLastVisit = new Date(lastVisit).toISOString();
    pool.connect((err, client, done) => {
      if(err) {
        return res.status(500).json({ error: "Failed to connect to the database" });
      }

      
    // Save the user details in the database using the hashed password

      client.query("INSERT INTO users VALUES ($1, $2, $3, $4, $5, $6)", 
      [id, name, isoJoined, isoLastVisit, counter, hashedPass], (err, result) => {
        done();
        if (err) {
          return res.status(500).json({ error: "Failed to insert user" });
        }
        res.status(201).json({ message: "User added successfully!"});
      });
    
      
    });
  
  
});

router.put("/:id", authenticateToken, async function (req, res, next) {
  const id = req.params.id;
  const { name, joined, lastVisit, counter } = req.body;
  pool.connect((err, client, done) => {
    client.query("UPDATE users SET name = $1, joined = $2, lastVisit = $3, counter = $4 WHERE id = $5",
    [name, joined, lastVisit, counter, id], async (err, result) => {
      if (err) {
        done();
        return res.status(500).json({ error: "Failed to update user" });
      }
      done();
     });
  });

  res.status(200).json({ message: "User updated successfully!" });
});

module.exports = router
