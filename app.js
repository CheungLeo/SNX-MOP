require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());

app.use("/api/surveycake", require("./routes/otp"));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});