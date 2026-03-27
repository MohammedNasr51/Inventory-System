const jsonServer = require("json-server");
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

const fs = require("fs");
const path = require("path");

const isProd = process.env.NODE_ENV === "production";
const sourcePath = path.join(__dirname, "../db.json");
const tempPath = "/tmp/db.json";

if (!fs.existsSync(tempPath)) {
  fs.copyFileSync(sourcePath, tempPath);
}

// Pass the string path to json-server so it automatically handles file persistence
const routerPath = isProd ? tempPath : sourcePath;
const router = jsonServer.router(routerPath);

server.use(middlewares);

// CORS for frontend
const allowedOrigins = [
  "https://inventory-system-livid-three.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

server.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

server.use(
  jsonServer.rewriter({
    "/api/*": "/$1",
  }),
);

server.use(router);


if (process.env.NODE_ENV !== "production") {
  server.listen(3000, () => {
    console.log("JSON Server is running on http://localhost:3000");
  });
}

module.exports = server;
