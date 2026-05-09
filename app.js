const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();
const cors = require("cors");
const express = require("express");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//debug log
app.use((req, res, next) => {

  console.log("=================================");
  console.log("Incoming Request");
  console.log("Time:", new Date().toISOString());

  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);

  console.log("Headers:");
  console.log(req.headers);

  console.log("Query:");
  console.log(req.query);

  console.log("Body:");
  console.log(req.body);

  console.log("IP:", req.ip);

  console.log("=================================");

  next();
});

app.use("/api/surveycake", require("./routes/otp"));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});