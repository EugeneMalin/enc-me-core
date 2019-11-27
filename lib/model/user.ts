import { Model, DataTypes } from "sequelize";
import {connection} from "../sequelize";
import crypto from 'crypto';
import {Member, Group} from "../relations";

export interface IUserDraft {
    username: string
    hashedPassword: string
    salt: string
}

export interface IUser extends IUserDraft {
    id?: number
    password?: string
    firstName?: string
    lastName?: string
    email?: string
    token?: string
}

class User extends Model implements IUser {
    public id!: number;
    public memberId!: number;

    public username!: string;
    public hashedPassword!: string;
    public salt!: string;
    public token!: string;
    public email!: string;
    public firstName!: string;
    public lastName!: string;
    public member!: Member
    public group!: Group

    private _plainPassword: string = '';

    public encrypt(password: string): string {
        return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    }

    public check(password: string): boolean {
        return this.encrypt(password) === this.hashedPassword;
    }
    set password(password) {
        this._plainPassword = password;
        this.salt = crypto.randomBytes(32).toString('hex');
        this.hashedPassword = this.encrypt(password);
    }

    get password() {
        return this._plainPassword;
    }

    static getDraft(username: string, password: string): IUser {
        const u = new User();
        
        u.username = username;
        u.password = password;

        return {
            username: u.username,
            hashedPassword: u.hashedPassword,
            salt: u.salt,
            firstName: '',
            lastName: '',
            email: ''
        };
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    hashedPassword: DataTypes.STRING,
    token: DataTypes.STRING,
    email: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    salt: DataTypes.STRING
}, {
    modelName: 'user', sequelize: connection
})

export default User;
