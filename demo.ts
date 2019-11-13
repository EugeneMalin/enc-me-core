var faker = require('Faker');

import User from './lib/model/user'
import Client from './lib/model/client'
import AccessToken from './lib/model/accesstoken'
import RefreshToken from './lib/model/refreshtoken'
import sequelize from './lib/sequelize';
import logger from './lib/log';

import './lib/relations';
import './lib/auth';

sequelize.sync()

User.destroy({
    where: {}
}).then(function() {
    User.create(User.getDraft("andrey", "simplepassword" )).then((u) => {
        logger.info("user:" + u.username + u.password + u.hashedPassword)
    });

    logger.info('Creating random users:')
    for(let i=0; i<4; i++) {
        const password = faker.Lorem.words(1)[0]
        const u = User.getDraft(faker.random.first_name().toLowerCase(), password);
        logger.info("user:" + u.username + password + u.hashedPassword)

        User.create(u);
    }
});

Client.destroy({
    where: {}
}).then(function() {
    Client.create({ name: "OurService iOS client v1", id: "mobileV1", clientSecret:"abc123456" }).then(function(client) {
        logger.info([client.id, client.clientSecret].join());
    });
});
AccessToken.destroy({where: {}});
RefreshToken.destroy({where: {}});
