import express from 'express'
import {validationResult} from "express-validator";
// @ts-ignore
import socket from 'socket.io';
import bcrypt from 'bcrypt';

import generatePasswordHash from "../utils/generatePasswordHash"
import DB from "../core/postgreDB";
import {createJWTToken} from "../utils";






class UserController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io = io;
    }


    create = async (req: express.Request, res: express.Response) => {
        try {
            const {email, fullname, password, avatar} = req.body
            const {rows: [newUser]} = await DB.query(
                    `INSERT INTO table_user (fullname, email, password, avatar) values ($1, $2, $3, $4) RETURNING *`,
                [fullname, email, await generatePasswordHash(password), avatar])
            res.json({
                status: "success",
                newUser
            })
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    };


    login = async (req: express.Request, res: express.Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }

            const {email, password} = req.body
            const {rows: [user]} = await DB.query(
                    `SELECT * FROM table_user where email=$1`, [email])
            if (!user && await bcrypt.compare(password, user.password)) {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            res.json({
                status: 'success',
                token: createJWTToken(user)
            })


        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    };

    getUserMeta = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
            const {rows: userMeta} = await DB.query(
                    `select id_user, _id_dialog, fullname from user_dialog, table_user where user_dialog.id_user=table_user._id and user_dialog.id_user!=$1 `, [user_id])
            const userMetaObj = userMeta.reduce((acc: any, current: any, ) => {
                const key:any= current._id_dialog;
                return {
                    ...acc,
                    [key]:current
                }
            }, {})

            res.json(userMetaObj)
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

    getFullNameForUser= async (req: any, res: express.Response) => {
        try {
            const {user_id} = req.query
            const {rows: [{fullname}]} = await DB.query(
                `select fullname from table_user i where _id=$1`, [user_id])
            res.json(fullname)
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    }

    getMe = async (req: any, res: express.Response) => {
        try {
            const {_id: user_id} = req.user
            const {rows: [user]} = await DB.query(`select * from table_user where _id=$1`, [user_id])
            if (!user) {
                return res.status(404).json({
                    message: "user not found"
                });
            }
            res.json(user);
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }
    };

    findUsers = async (req: any, res: express.Response) => {
        try {
            const {query} = req.query
            const {_id: user_id} = req.user
            const {rows: users} = await DB.query(
                    `SELECT _id,fullname, email,avatar FROM (SELECT * from table_user where  _id <> $2) as A where fullname LIKE $1 or email  LIKE $1 `,
                [query, user_id])
            res.json(users)
        } catch (e) {
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }

    };

}



export default UserController;
