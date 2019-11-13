import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";
import crypto from 'crypto';
class User extends Model {
    public id!: number;
    public username!: string;
    public hashedPassword!: string;
    public salt!: string;

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

    static getDraft(username: string, password: string): object {
        const u = new User();
        
        u.username = username;
        u.password = password;

        return {
            username: u.username,
            hashedPassword: u.hashedPassword,
            salt: u.salt
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
        unique: true
    },
    hashedPassword: DataTypes.STRING,
    salt: DataTypes.STRING
}, {
    modelName: 'user', sequelize
})

export default User;
