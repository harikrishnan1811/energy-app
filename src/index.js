require("dotenv").config();
const express = require("express");
const routes = require("./routes/routes");
const { logInfo } = require("./utils/logger");

const app = express();
app.use(express.json());
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logInfo(`Server running on port ${PORT}`));
