const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const accepts = require("accepts");
const js2xmlparser = require("js2xmlparser");
const cors = require("cors");
const db = require("./db");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.get("/coupons", (request, response) => {
  const accept = accepts(request);
  db.query("SELECT * FROM coupon", (error, results) => {
    if (error || results.length == 0) {
      response.status(404);
      response.send();
    } else {
      switch (accept.type(["json", "xml"])) {
        case "json":
          response.setHeader("Content-Type", "application/json");
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.setHeader('Access-Control-Allow-Credentials', true);
          response.status(200);
          response.send(results);
          break;
        case "xml":
          response.setHeader("Content-Type", "application/xml");
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.setHeader('Access-Control-Allow-Credentials', true);
          response.status(200);
          response.send(js2xmlparser.parse("coupons", results));
          break;
        default:
          response.status(406);
          response.send();
          break;
      }
    }
  });
});

app.get("/coupons/:code", (request, response) => {
  const accept = accepts(request);
  db.query(
    "SELECT * FROM coupon where code = ?",
    [request.params.code],
    (error, results) => {
      if (error || results.length == 0) {
        response.status(404);
        response.send();
      } else {
        switch (accept.type(["json", "xml"])) {
          case "json":
            response.setHeader("Content-Type", "application/json");
            response.status(200);
            response.send(results);
            break;
          case "xml":
            response.setHeader("Content-Type", "application/xml");
            response.status(200);
            response.send(js2xmlparser.parse("coupons", results));
            break;
          default:
            response.status(406);
            response.send();
            break;
        }
      }
    }
  );
});

app.post("/coupons", (request, response) => {
  db.query(
    "INSERT INTO coupon (code, expiration_date, discount) VALUES (?, ?, ?)", 
    [request.body.code, request.body.expiration_date, request.body.discount],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(201);
        response.send();
      }
    }
  );
});

app.put("/coupons/:code", (request, response) => {
  db.query(
    "UPDATE coupon SET code = ?, expiration_date = ?, discount = ? WHERE code = ?", 
    [request.body.code, request.body.expiration_date, request.body.discount, request.params.code],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(204);
        response.send();
      }
    }
  );
});

app.delete("/coupons/:code", (request, response) => {
  const date = new Date();
  const current = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
  db.query(
    "UPDATE coupon SET expiration_date = ? WHERE code = ?", 
    [current, request.params.code],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(204);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.send();
      }
    }
  );
});

module.exports.handler = serverless(app);
