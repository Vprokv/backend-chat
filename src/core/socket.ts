
// @ts-ignore
import socket from "socket.io"
export const userMap = new Map([])
import {verifyJWTToken} from "../utils";
export default (http: any) => {
    const io = socket(http);

    io.on('connection', async function (socket: socket.Server) {
        const {query} = socket.handshake
        if (query && query.token) {
            const {token} = query
            const {data}: any = await verifyJWTToken(token)
            const {_id: user_id} = data
            if (data) {
                userMap.set(user_id, socket.id)
            }
        }


    })


    return io;
};

