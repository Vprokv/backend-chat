import express from 'express'
import {DialogModel, MessageModel} from "../models";

class DialogController {

    index(req: express.Request, res: express.Response,) {
        const authorId: any = "5d1ba4777a5a9a1264ba240c";
        // const authorId= req.user._id;

        DialogModel.find({author: authorId})
            .populate(["author", "partner"])
            .exec(function (err, dialogs) {
            if (err) {
                return res.status(404).json({
                    message: "Dialog not found"
                });
            }
            return res.json(dialogs);
        });
    }

    create(req: express.Request, res: express.Response) {
        const postData = {
            author: req.body.author,
            dialogId: req.body.partner

        };
        const dialog = new DialogModel(postData);
        dialog
            .save()
            .then((dialogObj: any) => {
                const message = new MessageModel({
                    text: req.body.text,
                    user: req.body.author,
                    dialog: dialogObj._id,
                });

                message
                    .save()
                    .then(() => {
                        res.json({
                            dialog: dialogObj,
                        });
                    })
                    .catch(reason => {
                    res.json(reason)
                });

            })
            .catch(reason => {
                res.json(reason)
            });
    };

    delete(req: express.Request, res: express.Response) {
        const id: string = req.params.id;
        DialogModel.findByIdAndRemove({_id: id})
            .then(dialog => {
                if(dialog) {
                    res.json({
                        message: `Dialog deleted`
                    });
                    }
                           })
            .catch(() => {
                res.json({
                    message: `Dialog not found`
                });
            });
    }
}


export default DialogController;