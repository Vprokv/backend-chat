import express from 'express'
import {UserModels} from "../models";

export default (
    req: any,
    __: express.Response,
    next: express.NextFunction
) => {
    if (req.user) {
        UserModels.findOneAndUpdate(
            {_id: req.user._id},
            {
                last_seen: new Date()
            },
            {new: true},
            () => {}
        );
    }
    next();
};