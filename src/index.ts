import express from 'express'
import dotenv from "dotenv";

import {createServer} from 'http'
import "./core/db";
import createRoutes from "./core/routes";

const app = express();
const http = createServer(app);
const io = require("socket.io")(http)

dotenv.config();
createRoutes(app);



io.on('connection', function(socket:any) {
    console.log('Connected');
    socket.emit("111", 'dfdfsdfsdf');

    socket.on("222", function(msg:any){
        console.log("Client SAY:" + msg);
    })

});

http.listen(process.env.PORT, function () {
console.log(`Server: http://localhost:${process.env.PORT}`);
});