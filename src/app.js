import express, { urlencoded, json } from "express";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(errorHandler);

export default app;
