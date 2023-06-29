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
    client.query("SELECT * FROM categories", (err, result) => {
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
    pool.connect((err, client, done) => {
        if (err) {
            return res.status(500).json({ error: "Failed to connect to the database" });

        }
        client.query("DELETE FROM categories WHERE id = $1", [id], (err, result) => {
            done();
            if (err) {
                return res.status(500).json({ error: "Failed to delete category" });
            }
            res.status(200).json({ message: "Category deleted successfully!" });
        });

    });
});

router.post("/", authenticateToken, function (req, res, next) {
    const { id, name } = req.body;
    pool.connect((err, client, done) => {
        if (err) {
            return res.status(500).json({ error: "Failed to connect to the database" });
        }
        client.query("INSERT INTO categories (id, name) VALUES ($1, $2)", [id, name], (err, result) => {
            done();
            if (err) {
                return res.status(500).json({ error: "Failed to insert category" });
            }
            res.status(201).json({ message: "Category added successfully!" });
        });
    });
});

router.put("/:id", authenticateToken, function (req, res, next) {  
    const id = req.params.id;
    const { name } = req.body;
    pool.connect((err, client, done) => {
        if (err) {
            return res.status(500).json({ error: "Failed to connect to the database" });
        }
        client.query("UPDATE categories SET name = $1 WHERE id = $2", [name, id], (err, result) => {
            done();
            if (err) {
                return res.status(500).json({ error: "Failed to update category" });
            }
            res.status(200).json({ message: "Category updated successfully!" });
        });
    });
});

module.exports = router
