const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: "variables.env" });
const createServer = require("./createServer");
const db = require("./db");

const server = createServer();
// use cookie
server.express.use(cookieParser());

// decode JWT so we can get the user id on each request
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put user id onto the req for further request to access
    req.userId = userId;
  }

  next();
});

server.express.use(async (req, res, next) => {
  if (!req.userId) return next();
  const user = await db.query.user(
    { where: { id: req.userId } },
    "{ name, email, permissions }"
  );

  req.user = user;

  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: [
        process.env.FRONTEND_URL,
        process.env.HEROKU_FRONTEND_URL,
        process.env.NOW_FRONTEND_URL
      ]
    }
  },
  details => {
    console.log(`Server is running on http://localhost:${details.port}`);
  }
);
