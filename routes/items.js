const { authenticateToken } = require("../controllers/authController");
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", authenticateToken, function (req, res, next) {
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(500).json({ error: "Failed to connect to the database" });
    }

    client.query("SELECT * FROM items", (err, result) => {
      if (err) {
        done(); // Release the client back to the pool
        return res.status(500).json({ error: "Failed to retrieve items" });
      }

      const items = result.rows;
      const finalItems = [];

      function fetchItemDetails(index) {
        if (index >= items.length) {
          done(); // Release the client back to the pool
          console.log(finalItems);
          return res.json(finalItems);
        }

        const item = items[index];

        client.query("SELECT * FROM categories WHERE id = $1", [item.categoryId], (err, categoryResult) => {
          if (err) {
            done();
            return res.status(500).json({ error: "Failed to retrieve category" });
          }

          const category = categoryResult.rows[0]; // Fetch the first row as an object
          client.query("SELECT * FROM users WHERE id = $1", [item.belongsToId], (err, userResult) => {
            if (err) {
              done();
              return res.status(500).json({ error: "Failed to retrieve user" });
            }

            const user = userResult.rows[0]; // Fetch the first row as an object

            finalItems[index] = {
              id: item.id,
              itemName: item.itemName,
              category: category,
              isItemReady: item.isItemReady,
              belongsTo: user,
            };

            fetchItemDetails(index + 1);
          });
        });
      }

      fetchItemDetails(0);
    });
  });
});

router.delete("/:id", authenticateToken, function (req, res, next) {
  const id = req.params.id;
  pool.connect((err, client, done) => {
    if (err) {
      return res.status(500).json({ error: "Failed to connect to the database" });
    }

    client.query("DELETE FROM items WHERE id = $1", [id], (err, result) => {
      done();
      if (err) {
        return res.status(500).json({ error: "Failed to delete item" });
      }
      res.status(200).json({ message: "Item deleted successfully!" });
    });
  });
});

router.post("/", authenticateToken, function (req, res, next) {
    const { id, itemName, category, isItemReady, belongsTo } = req.body;
  
    const numberId = Number(id);
    const categoryId = category.id;
    const belongsToId = belongsTo.id;

    console.log(numberId, itemName, categoryId, isItemReady, belongsToId)
    pool.connect((err, client, done) => {
      if (err) {
        return res.status(500).json({ error: "Failed to connect to the database" });
      }
  
      client.query("INSERT INTO items (\"id\", \"itemName\", \"isItemReady\", \"categoryId\", \"belongsToId\") VALUES ($1, $2, $3, $4, $5)",
        [numberId, itemName, isItemReady, categoryId, belongsToId],
        (err, result) => {
          done(); // Release the client back to the pool
  
          if (err) {
            return res.status(500).json({ error: "Failed to create item" });
          }
  
          res.status(201).json({ message: "Item created successfully!" });
        }
      );
    });
  });
  
  router.put("/:id", authenticateToken, function (req, res, next) {
    const id = req.params.id;
    const { itemName, category, isItemReady, belongsTo } = req.body;
  
    const categoryId = category.id;
    const belongsToId = belongsTo.id;

    console.log(itemName, categoryId, isItemReady, belongsToId, id)
    pool.connect((err, client, done) => {
      if (err) {
        return res.status(500).json({ error: "Failed to connect to the database" });
      }
  
      console.log(itemName, categoryId, isItemReady, belongsToId, id)
      client.query(
        "UPDATE items SET \"itemName\" = $1, \"categoryId\" = $2, \"isItemReady\" = $3, \"belongsToId\" = $4 WHERE id = $5",
        [itemName, categoryId, isItemReady, belongsToId, id],
        (err, result) => {
          done(); // Release the client back to the pool
  
          if (err) {
            return res.status(500).json({ error: "Failed to update item" });
          }
  
          res.status(200).json({ message: "Item updated successfully!" });
        }
      );
    });
  });
  
  module.exports = router;
