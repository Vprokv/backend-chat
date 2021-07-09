import express from 'express'
// @ts-ignore
import socket from 'socket.io';
import DB from "../core/postgreDB";
import {userMap} from "../core/socket";




class DialogController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }


    getDialog = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
            const {rows: dialogs} = await DB.query(
                `select t2.* from (select _id_dialog from user_dialog where id_user=$1) as t1
inner join
(select _id_dialog,array_agg(id_user) as id_user from user_dialog group by user_dialog._id_dialog) as t2
on t1._id_dialog=t2._id_dialog`, [user_id])
            res.json(dialogs)
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

//`select * from dialog dl inner join user_dialog ud on dl._id_dialog=ud._id_dialog where ud.id_user=$1`, [user_id])


    getDialogsMeta = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
            const {rows: dialogMeta} = await DB.query(
                    `select * from (select _id_dialog from user_dialog where id_user=$1) as t5
join
(select t4.*, t3.id_user from (select _id_dialog,array_agg(id_user) as id_user from user_dialog group by user_dialog._id_dialog) as t3 
inner join
(SELECT t1.*FROM message t1 
inner Join(select dialog_id, max(_id) as max_id_message from message group by dialog_id) as t2 
on t1.dialog_id =t2.dialog_id and t1._id=t2.max_id_message) as t4
on t3._id_dialog=t4.dialog_id) as t6
on t5._id_dialog=t6.dialog_id;`
                , [user_id])

            // console.log(await DB.query(`SELECT id_user FROM user_dialog WHERE _id_dialog = ANY($1::int[]) group by _id_dialog`,[[193,194,195]]))
            //SELECT _id_dialog,array_agg(id_user) FROM user_dialog WHERE _id_dialog = ($1) group by _id_dialog
            const dialogMetaObj = dialogMeta.reduce((acc: any, current: any ) => {
                const key:any= current.dialog_id;
                return {
                    ...acc,
                    [key]:current
                }
            }, {})
            res.json(dialogMetaObj) //reducer
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

            const {_id_dialog} = dialog

            const {rows: usersInDialog} = await DB.query(
                    `select id_user from user_dialog  where _id_dialog=$1`, [_id_dialog])
            const {rows: [dialogData]} = await DB.query(
                    `select _id_dialog,array_agg(id_user) as id_user from user_dialog where user_dialog._id_dialog=$1  group by user_dialog._id_dialog`, [_id_dialog])
            res.json(dialogData)

            usersInDialog.forEach((user: any) => {

                if (userMap.has(user.id_user)) {
                    this.io
                        .to(userMap.get(user.id_user))
                        .emit("SERVER:NEW_DIALOG", dialogData);
                }
            })

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
            const {rows: usersInDialog} = await DB.query(`select id_user from user_dialog where _id_dialog=$1`, [dialog_id])
            await DB.query(
                    `DELETE FROM dialog dl using user_dialog ud where dl._id_dialog=ud._id_dialog and dl._id_dialog=$1`, [dialog_id])

            res.status(200)
            usersInDialog.forEach((user: any) => {
                if (userMap.has(user.id_user)) {
                    this.io
                        .sockets
                        .to(userMap.get(user.id_user))
                        .emit("SERVER:DIALOG_DELETED", {dialog_id});
                }
            })

        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    };
}




export default DialogController;