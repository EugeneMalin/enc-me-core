import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class User extends Model {
    public id!: number;
    public username!: string;
    public hashedPassword!: string;
    public salt!: string;
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
