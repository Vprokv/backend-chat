import mongoose from 'mongoose'
import express from 'express'
import bodyParser from "body-parser";


import {UserController} from "./controllers";

const app = express();

app.use(bodyParser.json());

const User = new UserController();

mongoose.connect('mongodb://localhost:27017/chat', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true

});

app.get("/user/:id", User.show);
app.delete("/user/:id", User.delete);
app.post("/user/registration", User.create);


app.listen(3001, function () {
console.log("listen on port 3001");
});