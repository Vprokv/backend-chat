import mongoose, {Schema, Document} from 'mongoose';
import validator from "validator";
import {generatePasswordHash} from "../utils";



export interface IUser extends Document{
    email?: string;
    fullName?: string;
    password?: string;
    confirmed?: boolean;
    avatar?: string;
    confirm_hash?: string,
    last_seen?: Date,

}

const UserSchema = new Schema({
    email: {
        type:String,
        required: 'Email address is required',
        validate: [validator.isEmail, 'Invalid email'],
        unique: true
    },
    fullName: {
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
    avatar: String,
    last_seen: {
        type: Date,
        default: new Date()
    },
}, {
    timestamps: true
});

UserSchema.pre('save', function(next) {
    const user: IUser = this;

    if (!user.isModified('password')) return next();

    generatePasswordHash(user.password)
        .then(hash => {
            user.password = String(hash);
            generatePasswordHash(""+Date.now()).then(confirmHash => {
                user.confirm_hash = String(confirmHash);
                next();
            })
        })
        .catch(err => {
            next(err);
        });
});

const UserModels = mongoose.model<IUser>('User', UserSchema);

export default UserModels;
