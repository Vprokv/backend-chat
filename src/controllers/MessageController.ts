import express from 'express'
import DB from "../core/postgreDB";
// @ts-ignore
import socket from 'socket.io';
import {userMap} from "../core/socket";

class MessageController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io=io;
    }

    sendMessage = async (req: any, res: express.Response) => {
        try {
            const {text, dialog_id} = req.body
            const {_id: author_id} = req.user
            const {rows: usersInDialog} = await DB.query(`select id_user from user_dialog where _id_dialog=$1`, [dialog_id])
            const createdAt = new Date()
            const {rows: [newMessage]} = await DB.query(
                    `INSERT INTO message(text, dialog_id, author_id, createdat) values ($1, $2, $3, $4) RETURNING *`,
                [text, dialog_id, author_id, createdAt])
            const {rows: [{fullname, avatar}]} = await DB.query(`select fullname, avatar from table_user where _id=$1`, [author_id])
            const {rows: [{id_user}]} = await DB.query(`
select array_agg(id_user) as id_user from user_dialog where user_dialog._id_dialog=$1  group by user_dialog._id_dialog `, [dialog_id])
            const dialogMeta = {
                fullname: fullname,
                _id: newMessage._id,
                text: newMessage.text,
                createdat: newMessage.createdat,
                dialog_id: newMessage.dialog_id,
                author_id: newMessage.author_id,
                avatar: avatar,
                id_user:id_user
            }
            usersInDialog.forEach((user: any) => {
                if (userMap.has(user.id_user)) {
                    this.io
                        .sockets
                        .to(userMap.get(user.id_user))
                        .emit("SERVER:NEW_MESSAGE", dialogMeta);
                    this.io
                        .sockets
                        .to(userMap.get(user.id_user))
                        .emit("SERVER:NEW_META_SEND", dialogMeta);
                }
            })
        } catch (e) {
            return res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

    getMessages = async (req: any, res: express.Response) => {
        try {
            const {dialog_id} = req.query
            const {rows: messages} = await DB.query(
                `select ms.*,tu.fullname,tu.avatar  from message ms inner join table_user tu on  ms.author_id=tu._id where  "dialog_id"=$1`,
                [dialog_id])
            res.json(messages)


        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

    removeMessageById = async (req: any, res: express.Response) => {
        try {
            const message_id = req.params.id
            const {rows: [dialogMeta]}= await DB.query(` select ms.*, tu.fullname from message ms inner join table_user tu on  ms.author_id=tu._id where ms._id=($1-1)`, [message_id])
            const {rows: [{dialog_id}]} = await DB.query(`select dialog_id from message where _id=$1`, [message_id])
            const {rows: usersInDialog} = await DB.query(`select id_user from user_dialog where _id_dialog=$1`, [dialog_id])
            await DB.query(`DELETE FROM message where _id=$1`, [message_id])
            res.status(200)
            usersInDialog.forEach((user: any) => {
                this.io
                    .to(userMap.get(user.id_user))
                    .emit("SERVER:MESSAGE_DELETED", {message_id, dialog_id});
                this.io
                    .sockets
                    .to(userMap.get(user.id_user))
                    .emit("SERVER:NEW_META_REMOVE", dialogMeta);
            })
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

}


export default MessageController ;