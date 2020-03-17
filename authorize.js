const jwt = require("jsonwebtoken");
const _ = require("lodash");
require("dotenv").config();

const ADMIN = 4;
const ACCOUNTANT = 3;
const CLERK = 2;
const CUSTOMER = 1;

const authorizeUser = (userEmail, userRole, methodArn) => {
  console.log(
    `authorizeUser ${JSON.stringify(userEmail)} ${JSON.stringify(
      userRole,
    )} ${methodArn}`,
  );

  // Allowed for any role
  if (methodArn.includes("/" + userEmail)) return true;

  // Authorization by role
  switch (userRole) {
    case ADMIN:
      return true;
    case ACCOUNTANT:
      if (
        methodArn.includes("/orders/taxes") ||
        methodArn.includes("/orders/reports")
      ) {
        return true;
      }
      return false;
    case CLERK:
      if (
        methodArn.includes("/orders") &&
        !methodArn.includes("/taxes") &&
        !methodArn.includes("/reports")
      ) {
        return true;
      }
      if (methodArn.includes("/products")) {
        return true;
      }
      return false;
    case CUSTOMER:
      if (methodArn.includes("POST/orders")) return true;
      return false
  }

  return false;
};

const getToken = event => {
  if (
    event.authorizationToken &&
    event.authorizationToken.split(" ")[0] === "Bearer"
  ) {
    return event.authorizationToken.split(" ")[1];
  } else {
    return event.authorizationToken;
  }
};

const buildIAMPolicy = (userId, effect, resource, context) => {
  console.log(`buildIAMPolicy ${userId} ${effect} ${resource}`);
  const policy = {
    principalId: userId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };

  console.log(JSON.stringify(policy));
  return policy;
};

module.exports.handler = (event, context, callback) => {
  console.log("authorize");
  console.log(event);

  let token = getToken(event);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(JSON.stringify(decoded));

    // Checks if the user's scopes allow her to call the current endpoint ARN
    const email = decoded.email;
    const role = decoded.role;
    const isAllowed = authorizeUser(email, role, event.methodArn);

    // Return an IAM policy document for the current endpoint
    const effect = isAllowed ? "Allow" : "Deny";
    const authorizerContext = { email: JSON.stringify(email) };
    const policyDocument = buildIAMPolicy(
      email,
      effect,
      event.methodArn,
      authorizerContext,
    );

    console.log("Returning IAM policy document");
    callback(null, policyDocument);
  } catch (e) {
    console.log(e.message);
    callback("Unauthorized"); // Return a 401 Unauthorized response
  }
};
