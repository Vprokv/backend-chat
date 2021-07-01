import express from 'express'
// @ts-ignore
import socket from 'socket.io';
import DB from "../core/postgreDB";
import {DialogModel, MessageModel} from "../models";

class DialogController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }

    getDialog = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
            const {rows: dialogs} = await DB.query(
                    `select * from dialog dl inner join user_dialog ud on dl._id=ud.id_dialog where ud.id_user=$1`, [user_id])
            res.json(dialogs)
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

    getDialogsMeta = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

    addUserInDialog = async (user_id: any, {name, _id}: any, dbClient: any) => {
        await dbClient.query(
                `INSERT INTO user_dialog (id_user, id_dialog) values ($1, $2)`, [user_id, _id])
        this.io.emit("SERVER:NEW_DIALOG", {name, _id})
    }

    createDialog = async (req: any, res: express.Response) => {
        const client = await DB.connect()
        try {
            client.query('BEGIN')

            const {name, partner_id} = req.body
            const {_id: user_id} = req.user
            const {rows: [dialog]} = await client.query(
                    `INSERT INTO dialog (name) values ($1) RETURNING *`, [name])
            await this.addUserInDialog(user_id, dialog, client)
            await this.addUserInDialog(partner_id, dialog, client)

            await client.query("COMMIT")
            res.status(200)
        } catch (e) {
            await client.query("ROLLBACK")
            res.status(500).json({
                status: "error",
                message: e.message
            });
        } finally {
            client.release()
        }
    };

    removeDialogById = async (req: express.Request, res: express.Response) => {
        try {
            const dialog_id = req.params.id
            const {rows: dialog} = await DB.query(`DELETE FROM dialog where _id=$1`, [dialog_id])
            res.status(200)
            this.io.emit("SERVER:Dialog_DELETED", {dialog})
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    };


}


export default DialogController;