import express from 'express'
// @ts-ignore
import socket from 'socket.io';
import DB from "../core/postgreDB";


class DialogController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }

    getDialog = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
            const {rows: dialogs} = await DB.query(
                    `select * from dialog dl inner join user_dialog ud on dl._id_dialog=ud._id_dialog where ud.id_user=$1`, [user_id])
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

    addUserInDialog = async (user_id: any, {name, _id_dialog}: any, dbClient: any) => {
             await dbClient.query(
                    `INSERT INTO user_dialog (id_user, _id_dialog) values ($1, $2)`, [user_id, _id_dialog])
           this.io.emit("SERVER:NEW_DIALOG", {name, _id_dialog})

    }

        createDialog = async (req: any, res: express.Response) => {
            const client = await DB.connect()
            try {
                client.query('BEGIN')

                const {name, partner_id} = req.body
                const {_id: user_id} = req.user
                const {rows: [dialog]} = await client.query(
                        `INSERT INTO dialog (name) values ($1) RETURNING *`, [name])
                console.log(dialog)
                await this.addUserInDialog(user_id, dialog, client)
                await this.addUserInDialog(partner_id, dialog, client)

                await client.query("COMMIT")
                res.json(dialog)

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
                const dialogId = req.params.id
                const {rows: dialog} = await DB.query(
                        `DELETE FROM dialog dl using user_dialog ud where dl._id_dialog=ud._id_dialog and dl._id_dialog=$1`,
                    [dialogId])
                const {dialog_id} = dialog
                res.status(200)
                this.io.emit("SERVER:DIALOG_DELETED", {dialog_id})
            } catch (e) {
                res.status(500).json({
                    status: "error",
                    message: e.message
                });
            }
        };
    }




export default DialogController;