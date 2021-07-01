import express from 'express'
import {MessageModel, DialogModel, UserModels} from "../models";
import DB from "../core/postgreDB";
// @ts-ignore
import socket from 'socket.io';
import {createJWTToken} from "../utils";

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
            this.io.emit("SERVER:NEW_MESSAGE", newMessage);
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
            res.status(200)
            this.io.emit("SERVER:MESSAGE_DELETED", {message})
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }



    index = (req: express.Request, res: express.Response) => {
        const dialogId: any = req.query.dialog;

        MessageModel.find({dialog: dialogId})
            .populate(["dialog", "user"])
            .exec(function (err, messages) {
                if (err) {
                    return res.status(404).json({
                        message: "Messages not found"
                    });
                }
                return res.json(messages);
            });
    }
}



export default MessageController ;