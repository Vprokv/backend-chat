import mongoose from 'mongoose'
import express from 'express'
import bodyParser from "body-parser";


import
{
    UserController,
    DialogController,
    MessageController
} from "./controllers";

const app = express();

app.use(bodyParser.json());

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

app.get("/dialogs/", Dialog.index);
app.delete("/dialogs/:id", Dialog.delete);
app.post("/dialogs", Dialog.create);

app.get("/messages", Messages.index);
app.delete("/messages/:id", Messages.delete);
app.post("/messages", Messages.create);


app.listen(3001, function () {
console.log("listen on port 3001");
});