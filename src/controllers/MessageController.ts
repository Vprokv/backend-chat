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

    create = async (req: any, res: express.Response) => {

        try {
            const {text, dialog_id, author_id, createdAt} = req.body
            const newMessage = await DB.query(
                    `INSERT INTO message(text, dialog_id, author_id, createdat) values ($1, $2, $3, $4) RETURNING *`,
                [text, dialog_id, author_id, createdAt])
            res.json(newMessage.rows[0])
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
            const userId = req.user._id
            const dialogId = req.dialog._id
            const {rows: message} = await DB.query(`select * from message where user_id=$1 and dialog_id=$2`,
                [userId, dialogId])
            if (!message) {
                return res.status(404).json({
                    message: "message not found"
                });
            }
            res.json(message)
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }


    delete = (req: any, res: express.Response): void => {
        const id: string = req.query.id;
        const userId: string = req.user._id;

        MessageModel.findById(id, (err: any, message: any) => {
            if (err || !message) {
                return res.status(403).json({
                    status: "error",
                    message: "Message not found"
                });
            }

            if (message.user.toString() === userId) {
                const dialogId = message.dialog;
                message.remove();


                MessageModel.findOne(
                    {dialog: dialogId},
                    {},
                    {sort: {createdAt: -1}},
                    (err, lastMessage) => {
                        if (err) {
                            res.status(500).json({
                                status: "error",
                                message: err
                            });
                        }

                        DialogModel.findById(dialogId, (err: any, dialog: any) => {
                            if (err) {
                                res.status(500).json({
                                    status: "error",
                                    message: err,
                                });
                            }

                            if (!dialog) {
                                return res.status(404).json({
                                    status: "not found",
                                    message: err,
                                });
                            }

                            dialog.lastMessage = lastMessage
                                // ? lastMessage.toString() : "";
                            dialog.save();
                        });
                    }
                );

                return res.json({
                    status: "success",
                    message: "Message deleted",
                });
            } else {
                return res.status(403).json({
                    status: "error",
                    message: "Not have permission",
                });
            }
        });
    };
}



export default MessageController ;