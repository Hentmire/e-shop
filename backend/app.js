const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
const path = require("path");

require("dotenv").config({ path: ".env" });
const api = process.env.API_URL;

app.use(cors());
app.options("*", cors());

//middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt);
app.use(
    "/public/uploads",
    express.static(path.join(__dirname, "/public/uploads/")),
);
app.use(errorHandler);

//Routers
const productRouter = require("./routers/products");
const orderRouter = require("./routers/orders");
const userRouter = require("./routers/users");
const categoryRouter = require("./routers/categories");

app.use(`${api}/products`, productRouter);
app.use(`${api}/orders`, orderRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/categories`, categoryRouter);

mongoose
    .connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log("Database connection has been established");
    })
    .catch((err) => {
        console.log("Databse connection failed with err", err);
    });

app.listen(3000, () => {
    console.log("api", api);
    console.log("The server is running now");
});
