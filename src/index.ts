import mongoose from 'mongoose'
import express from 'express'
import bodyParser from "body-parser";
import dotenv from "dotenv";


import {
    UserController,
    DialogController,
    MessageController
} from "./controllers";

import {
    updateLastSeen,
    chekAuth
} from './middlewares'

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use(updateLastSeen);
app.use(chekAuth);

const User = new UserController();
const Dialog = new DialogController();
const Messages = new MessageController();

mongoose.connect('mongodb://localhost:27017/chat', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true

});

app.get("/user/:id", User.show);
app.delete("/user/:id", User.delete);
app.post("/user/registration", User.create);
app.post("/user/login", User.login);

app.get("/dialogs/", Dialog.index);
app.delete("/dialogs/:id", Dialog.delete);
app.post("/dialogs", Dialog.create);

app.get("/messages", Messages.index);
app.delete("/messages/:id", Messages.delete);
app.post("/messages", Messages.create);


app.listen(process.env.PORT, function () {
console.log(`Server: http://localhost:${process.env.PORT}`);
});