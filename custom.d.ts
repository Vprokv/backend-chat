import {IUser} from "./src/models/Users";

declare namespace Express {
    export interface Request {
        user?: IUser;
    }
}