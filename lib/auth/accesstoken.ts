import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class AccessToken extends Model {
    public userId!: number;
    public clientId!: number;
    public token!: string;
    public createdAt!: Date;
}

AccessToken.init({
    userId: DataTypes.INTEGER,
    clientId: DataTypes.INTEGER,
    token: DataTypes.STRING
}, {
    modelName: 'accesstoken', sequelize
})

export default AccessToken
