const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const db = require("./db");
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/login", (request, response) => {
  db.query(
    "SELECT password, role FROM user WHERE email = ?", [request.body.email],
    (error, results) => {
      if (error || results.length == 0 || results[0].password != request.body.password) {
        response.status(401);
        response.send();
      } else {
        const token = jwt.sign({ email: request.body.email, role: results[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        response.status(200);
        response.setHeader("Authorization", "Bearer " + token);
        response.send();
      }
    }
  );
});

module.exports.handler = serverless(app);
