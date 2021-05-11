import mongoose, {Schema, Document} from 'mongoose';
import validator from "validator";


export interface IUser extends Document{
    email: string;
    fullname: string;
    password: string;
    confirmed: boolean;
    avatar: string;
    confirm_hash: string,
    last_seen: Date,

}

const UserSchema = new Schema({
    email: {
        type:String,
        required: 'Email address is required',
        validate: [validator.isEmail, 'Invalid email'],
        unique: true
    },
    fullname: {
        type:String,
        required: 'Fullname is required',
    },
    password: {
        type:String,
        required: 'password is required',
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    confirm_hash: String,
    last_seen: Date,
    avatar: String
}, {
    timestamps: true
});

const UserModels = mongoose.model<IUser>('User', UserSchema);

export default UserModels;
