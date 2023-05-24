require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const register = async (req, res, next) => {
  console.log(req.body);
  console.log("Registering user...");
  try {
    console.log("Hashing password...");
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    console.log("Creating user...");

    const insertUserQuery = `
        INSERT INTO users (name, joined, lastvisit, counter, password)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
    let currentDate = new Date();
    currentDate =
      currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString();
    const values = [req.body.login, currentDate, currentDate, 0, hashedPass];

    console.log(pool);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if user already exists
      const userExistQuery = `
          SELECT 1 FROM users WHERE name = $1;
        `;
      const userExistValues = [req.body.login];
      const userExistResult = await client.query(
        userExistQuery,
        userExistValues
      );
      if (userExistResult.rows.length > 0) {
        console.log("User exists");
        throw new Error("User already exists!");
      }

      // Insert new user
      const insertUserResult = await client.query(insertUserQuery, values);
      const userId = insertUserResult.rows[0].id;
      console.log("User added successfully! User ID:", userId);
      await client.query("COMMIT");

      res.status(201);
      res.json({
        message: "User added successfully!",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(error);
    res.setHeader("Location", "/");
    res.setHeader("Refresh", "4; url=/");
    res.status(500);
    res.json({
      message: "An error occurred!",
    });
  }
};

const login = async (req, res, next) => {
  console.log("Logging in user...");
  console.log(req.body);

  try {
    const { login, password } = req.body;
    console.log("Received password: " + password);
    console.log("Received login: " + login);

    const selectUserQuery = `
        SELECT id, name, password
        FROM users
        WHERE name = $1;
      `;
    const selectUserValues = [login];
    const result = await pool.query(selectUserQuery, selectUserValues);
    const user = result.rows[0];

    console.log("Checking if user is found...");
    if (!user) {
      res.status(404);
      console.log("User not found!");
      return res.json({
        message: "User not found!",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      res.status(401);
      console.log("Password does not match!");
      return res.json({
        message: "Password does not match!",
      });
    }

    let token;
    let message;

    if (isPasswordMatch && login === "admin") {
      token = generateAccessToken({ name: user.name, isAdmin: true });
      message = "Admin login successful!";
    } else {
      token = generateAccessToken({ name: user.name, isAdmin: false });
      message = "Login successful!";
    }

    res.status(200);
    console.log(message);

    const getCounterQuery = "SELECT counter FROM users WHERE name = $1";
    const getCounterQueryValues = [user.name];
    pool.query(getCounterQuery, getCounterQueryValues, (err, result) => {
      if (err) {
        console.error("Error retrieving counter:", err);
      } else {
        const counter = result.rows[0].counter;
        const currentDate =
          new Date().toLocaleDateString() +
          " " +
          new Date().toLocaleTimeString();
        const updateUserQuery =
          "UPDATE users SET lastvisit = $1, counter = $2 WHERE name = $3";
        const values = [currentDate, counter + 1, user.name];
        pool.query(updateUserQuery, values, (err, result) => {
          if (err) {
            console.error("Error updating column", err);
          } else {
            console.log("Column updated successfully");
          }
        });
      }
    });

    res.json({
      message: message,
      token: token,
    });
  } catch (error) {
    res.status(500);
    res.json({
      error,
    });
  }
};

function authenticateToken(req, res, next) {
  let token = req.headers.authorization;

  if (token) {
    token = token.split(" ")[1];
  }

  if (!token && req.cookies && req.cookies.my_cookie_name) {
    token = req.cookies.my_cookie_name.split(" ")[1];
  }

  if (!token) return res.sendStatus(401);

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      
      if (err) {
        console.log("Token expired or incorrect!");
        return res.sendStatus(403);
      } 
      req.user = user;
      next();
    });
  } catch (error) {
    //redirect to login page
    res.redirect("/");
  }
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
}

module.exports = {
  register,
  login,
  authenticateToken,
  generateAccessToken,
};
