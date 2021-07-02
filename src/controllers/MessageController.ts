import express from 'express'
import DB from "../core/postgreDB";
// @ts-ignore
import socket from 'socket.io';

class MessageController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io=io;
    }

    sendMessage = async (req: any, res: express.Response) => {
        try {
            const {text, dialog_id} = req.body
            const {_id: author_id} = req.user
            const createdAt = new Date()
            const {rows: [newMessage]} = await DB.query(
                    `INSERT INTO message(text, dialog_id, author_id, createdat) values ($1, $2, $3, $4) RETURNING *`,
                [text, dialog_id, author_id, createdAt])
            res.json(newMessage)
            this.io.emit("SERVER:NEW_MESSAGE", {newMessage, dialog_id});
            //вызов функции, которая выдаст все пользователей, участников диалогов, по id пользователя обращаюсь к сокету
            // и отправляю сообщение пользователю по id
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
            const {rows: messages} = await DB.query(`select * from message where "dialog_id"=$1`,
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
            const {rows: [message]} = await DB.query(`DELETE FROM message where _id=$1`, [message_id])
            const {dialog_id}=message
            res.status(200)
            console.log(message_id)
            this.io.emit("SERVER:MESSAGE_DELETED", {message_id, dialog_id})
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

}


export default MessageController ;