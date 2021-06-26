import bodyParser from "body-parser";
import {chekAuth, updateLastSeen} from "../middlewares";
import {UserCtrl, DialogCtrl, MessageCtrl} from "../controllers";
import {loginValidation, RegisterValidation} from "../utils/validations";
import express from "express";
// @ts-ignore
import socket from "socket.io";
import Pool from "../core/postgreDB"

const  createRoutes =   (app: express.Express, io: socket.Server) =>{
    const UserController = new UserCtrl(io);
    const DialogController = new DialogCtrl(io);
    const MessageController = new MessageCtrl(io);

    // const client = Pool.connect()
    //  client.query('SELECT NOW()')


    app.use(bodyParser.json());
    app.use(chekAuth);
    app.use(updateLastSeen);



    app.get("/user/me", UserController.getMe);
    app.get("/user/verify", UserController.verify);
    app.post("/user/signUp", RegisterValidation, UserController.create);
    app.post("/user/signIn", loginValidation, UserController.login);
    app.get("/user/find", UserController.findUsers);
    app.get("/user/:id", UserController.show);
    app.delete("/user/:id", UserController.delete);

    app.get("/dialogs/", DialogController.index);
    app.delete("/dialogs/:id", DialogController. delete);
    app.post("/dialogs", DialogController.create);

    app.get("/messages", MessageController.index);
    app.post("/messages", MessageController.create);
    app.delete("/messages/", MessageController.delete);
}

export default createRoutes;