import express from 'express'
import {UserModels} from "../models";
import {createJWTToken} from "../utils";
import {validationResult} from "express-validator";
import DB from "../core/postgreDB";
import generatePasswordHash from "../utils/generatePasswordHash"
// @ts-ignore
import socket from 'socket.io';
import bcrypt from 'bcrypt';

class UserController {
    io: socket.Server;

    constructor(io: socket.Server) {
        this.io=io;
    }

    show = (req: express.Request, res: express.Response) => {
        const id: string = req.params.id;
        UserModels.findById(id, (err: any, user: any) => {
            if (err) {
                return res.status(404).json({
                    message: "not found"
                });
            }
            res.json(user);
        });
    };


    delete = (req: express.Request, res: express.Response) => {
        // const id: string = req.params.id;
        // UserModels.findByIdAndRemove({_id: id})
            // .then(user => {
            //     if (user) {
            //         res.json({
            //             message: `User ${user.fullName} deleted`
            //         });
            //     }
            // })
            // .catch(() => {
            //     res.json({
            //         message: "User not found"
            //     });
            // });
    };

    getMe = (req: any, res: express.Response) => {
        const id: string = req.user._id;
        UserModels.findById(id, (err: any, user: any) => {
            if (err || !user) {
                return res.status(404).json({
                    message: "user not found"
                });
            }
            res.json(user);
        });
    };

    findUsers = (req: any, res: express.Response) => {
        const query: string = req.query.query;
        UserModels.find()
            .or([
                { fullName: new RegExp(query, "i") },
                { email: new RegExp(query, "i") }
            ])
            .then((users: any) => res.json(users))
            .catch((err: any) => {
                return res.status(404).json({
                    status: "error",
                    message: err
                });
            });
    };


    create = async (req: express.Request, res: express.Response) => {
        try {
            const {email, fullName, password, avatar} = req.body
        const newUser = await DB.query(
            `INSERT INTO table_user (fullname, email, password, avatar) values ($1, $2, $3, $4) RETURNING *`,
            [fullName, email, await generatePasswordHash(password), avatar])
        res.json(newUser.rows[0])
        } catch (e){
            res.status(500).json({
                status: "error",
                message: e.message
            });
        }

    };

    verify = (req: express.Request, res: express.Response) => {
        const hash = String(req.query.hash);

        if (!hash) {
            return res.status(422).json({ errors: "Invalid hash" });
        }

        UserModels.findOne({ confirm_hash: hash }, (err:any, user:any) => {
            if (err || !user) {
                return res.status(404).json({
                    status: "error",
                    message: "Hash not found"
                });
            }

            user.confirmed = true;
            user.save((err:any) => {
                if (err) {
                    return res.status(404).json({
                        status: "error",
                        message: err
                    });
                }

                res.json({
                    status: "success",
                    message: "Аккаунт успешно подтвержден!"
                });
            });
        });
    };

    login = async (req: express.Request, res: express.Response) => {

        try {
            const errors = validationResult(req);
            console.log(errors.isEmpty(), errors)
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }

            const {email, password} = req.body
            const {rows: [user]} = await DB.query(
                    `SELECT * FROM table_user where email=$1 and password=$2`,
                [email, await generatePasswordHash(password)])
            console.log(user)
            if (!user) {
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
}



export default UserController;