import { Model, DataTypes } from "sequelize";
import {connection} from "../sequelize";

class RefreshToken extends Model {
    public userId!: number;
    public clientId!: string;
    public token!: string;
    public createdAt!: Date;
}

RefreshToken.init({
    userId: DataTypes.INTEGER,
    clientId: DataTypes.STRING,
    token: DataTypes.STRING
}, {
    modelName: 'refreshtoken', sequelize: connection
})

export default RefreshToken
