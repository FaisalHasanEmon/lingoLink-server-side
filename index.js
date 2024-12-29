const express = require("express");
const app = express();
const port = process.env.PORT || 5500;
require("dotenv").config;

app.get("/", (req, res) => {
  res.send({ Message: "It's working" });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
