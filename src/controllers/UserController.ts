import express from 'express'
import {UserModels} from "../models";
import {createJWTToken} from "../utils";
import {validationResult} from "express-validator";


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
        const id: string = req.params.id;
        UserModels.findByIdAndRemove({_id: id})
            .then(user => {
                if(user) {
                    res.json({
                        message: `User ${user.fullName} deleted`
                    });
                    }
                           })
            .catch(() => {
                res.json({
                    message: "User not found"
                });
            });
    }

    getMe = (req: any, res: express.Response) => {
        const id: string = req.user._id;
        UserModels.findById(id, (err: any, user: any) => {
            if (err || !user) {
                return res.status(404).json({
                    message: "not found"
                });
            }
            res.json(user);
        });
    };

    create = (req: express.Request, res: express.Response) => {
        const postData = {
            email: req.body.email,
            fullName: req.body.fullName,
            password: req.body.password
        };

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const user = new UserModels(postData);

        user
            .save()
            .then((obj: any) => {
                res.json(obj);
            })
            .catch(reason => {
                res.status(500).json({
                    status: "error",
                    message: reason
                });
            });
    };

    verify = (req: express.Request, res: express.Response) => {
        const hash  = String(req.query.hash);
        if (!hash) {
            return res.status(422).json({errors: "Invalid hash"});
        }
        UserModels.findOne({confirm_hash: hash}, (err: any, user: any) => {
            if (err || !user) {
                return res.status(404).json({
                    status: 'error',
                    message: "Hash not found"
                });
            }
            user.confirmed = true;

            user.save((err: any) => {
                if (err) {
                    return res.status(404).json({
                        status: 'error',
                        message: err
                    });
                }
                res.json({
                    status: "success",
                    message: "Аккаунт успешно подтвержден"
                });
            });
        });

    }

    login = (req: express.Request, res: express.Response) => {
        const postData = {
            email: req.body.email,
            password: req.body.password,
        };

        const errors = validationResult(req);


        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }


        UserModels.findOne({
            email:postData.email
        }, (err:any, user:any) => {
            if (err || !user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }
            if (bcrypt.compareSync(postData.password, user.password)) {
                const token = createJWTToken(user);
                res.json({
                    status: 'success',
                    token
                });
            } else {
                res.status(403).json({
                    status: 'error',
                    message: "Incorrect password or email"
                });
            }
        });
    };
}



export default UserController;