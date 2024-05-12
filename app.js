require("dotenv").config();

const express = require("express");
const expressLayout = require("express-ejs-layouts");
const methodOverride = require("method-override");
const connectDB = require("./server/config/db");
const mongoose = require("mongoose");
const session = require("express-session");
const app = express();
const port = 5000 || process.env.PORT;
const cookieParser = require("cookie-parser");
const mongoStore = require("connect-mongo");
const { isActiveRoute } = require("./server/helpers/routerHelpers")

// Connect to DB
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: mongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    })
}));

app.use(express.static("public"));

// Templating Engine
app.use(expressLayout);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");

app.locals.isActiveRoute = isActiveRoute;

app.use("/", require("./server/routes/main"))
app.use("/", require("./server/routes/admin"))

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})