
import {verifyJWTToken} from "../utils";



export default (req: any, res: any, next: any) => {
    if (
        req.path === "/user/signIn" ||
        req.path === "/user/signUp"

    ) {
        return next();
    }

    const token = req.headers.token;

    verifyJWTToken(token)
        .then((user: any) => {
            req.user = user.data._doc;
            next();
        })
        .catch(err => {
            res.status(403).json(
                { message: "Invalid auth token provided." });
        });
};