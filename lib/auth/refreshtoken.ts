import { Model, DataTypes } from "sequelize";
import sequelize from "../sequelize";

class RefreshToken extends Model {
    public userId!: number;
    public clientId!: number;
    public token!: string;
    public createdAt!: Date;
}

RefreshToken.init({
    userId: DataTypes.INTEGER,
    clientId: DataTypes.INTEGER,
    token: DataTypes.STRING
}, {
    modelName: 'refreshtoken', sequelize
})

export default RefreshToken
