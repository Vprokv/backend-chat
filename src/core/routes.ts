import bodyParser from "body-parser";
import {chekAuth} from "../middlewares";
import {UserCtrl, DialogCtrl, MessageCtrl} from "../controllers/";
import {loginValidation, RegisterValidation} from "../utils/validations";
import express from "express";
// @ts-ignore
import socket from "socket.io";

const  createRoutes =   (app: express.Express, io: socket.Server) =>{
    const UserController = new UserCtrl(io);
    const DialogController = new DialogCtrl(io);
    const MessageController = new MessageCtrl(io);

    app.use(bodyParser.json());
    app.use(chekAuth);



    app.post("/user/signUp", RegisterValidation, UserController.create);
    app.post("/user/signIn", loginValidation, UserController.login);
    app.get("/user/me", UserController.getMe);
    app.get("/user/find", UserController.findUsers);
    app.get("/user/meta", UserController.getUserMeta);
    app.get("/user/", UserController.getFullNameForUser);

    app.get("/dialogs", DialogController.getDialog);
    app.get("/dialogs/meta", DialogController.getDialogsMeta);
    app.post("/dialogs", DialogController.createDialog);
    app.delete("/dialogs/:id", DialogController. removeDialogById);

    app.get("/messages/", MessageController.getMessages);
    app.post("/messages", MessageController.sendMessage);
    app.delete("/messages/:id", MessageController.removeMessageById);
}

export default createRoutes;