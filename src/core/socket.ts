import http from "http"
// @ts-ignore
import socket from "socket.io"
export default (http: http.Server) => {
    const io = socket(http);

    io.on('connection', function(socket: socket.Socket) {

        })
   return io;
};