const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const accepts = require("accepts");
const js2xmlparser = require("js2xmlparser");
const db = require("./db");
const cors = require("cors");
const app = express();

// create application/json parser
const jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: true })

app.use(urlencodedParser);
app.use(jsonParser);
app.use(cors());

const columns =
  "name, description, category, department, photo_url, wholesale_price_cents, retail_price_cents, discountable, stock, deleted";

app.get("/products", (request, response) => {
  const accept = accepts(request);
  let category = request.query.category;
  let department = request.query.department;
  if (category == undefined) category = "%";
  if (department == undefined) department = "%";
  db.query("SELECT * FROM product WHERE department LIKE ? AND category LIKE ? AND deleted = 0;", [department, category], (error, results) => {
    if (error) {
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
  });
});

app.get("/products/:id", (request, response) => {
  const accept = accepts(request);
  db.query(
    "SELECT * FROM product where id = ?",
    [request.params.id],
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
    },
  );
});

app.post("/products", (request, response) => {
  db.query(
    `INSERT INTO product (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request.body.name,
      request.body.description,
      request.body.category,
      request.body.department,
      request.body.photo_url,
      request.body.wholesale_price_cents,
      request.body.retail_price_cents,
      request.body.discountable,
      request.body.stock,
      false,
    ],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(201);
        response.send(results);
      }
    },
  );
});

app.put("/products/:id", (request, response) => {
  
  console.log("DOING PUT ON PRODUCT ID: " + request.params.id);
  console.log("REQUEST: ");
  console.log(request);
  console.log("REQEST BODY: ");
  console.log(request.body);
  
  const sql =
    "UPDATE product SET name = ?, description = ?, category = ?, department = ?, photo_url = ?, wholesale_price_cents = ?, retail_price_cents = ?, discountable = ?, stock = ? WHERE id = ?";
  const values = [
    request.body.name,
    request.body.description,
    request.body.category,
    request.body.department,
    request.body.photo_url,
    request.body.wholesale_price_cents,
    request.body.retail_price_cents,
    request.body.discountable,
    request.body.stock,
    request.params.id,
  ];

  db.query(sql, values, (error, results) => {
    if (error || results.affectedRows == 0) {
      response.status(400);
      response.send();
    } else {
      response.status(204);
      response.send();
    }
  });
});

app.delete("/products/:id", (request, response) => {
  db.query(
    "UPDATE product SET deleted = ? WHERE id = ?",
    [1, request.params.id],
    (error, results) => {
      if (error || results.affectedRows == 0) {
        response.status(400);
        response.send();
      } else {
        response.status(204);
        response.send();
      }
    },
  );
});

module.exports.handler = serverless(app);