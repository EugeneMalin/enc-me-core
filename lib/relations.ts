import Task from "./model/task";
import Answer from "./model/answer";
import Match from "./model/match";
import Hint from "./model/hint";
import Team from "./model/team";
import Gamer from "./model/gamer";
import TeamGamer from "./model/teamgamer";
import MatchParticipant from "./model/matchparticipant";
import User from "./model/user";
import Client from "./model/client";
import AccessToken from "./model/accesstoken";
import RefreshToken from "./model/refreshtoken";
import Message from "./model/message";
import Conversation from "./model/conversation";

// One task can have many answers
Task.hasMany(Answer)
// One answer should have task
Answer.belongsTo(Task, {foreignKey: 'taskId'});
// One task can have many hints
Task.hasMany(Hint);
// One hint should have task
Hint.belongsTo(Task, {foreignKey: 'taskId'});

// One match can have many tasks
Match.hasMany(Task)
// One task should have Match
Task.belongsTo(Match, {foreignKey: 'matchId'});

// One team has one capitain
Team.belongsTo(Gamer)
Team.belongsToMany(Gamer, {
    through: {
        model: TeamGamer,
        unique: false,
    },
    foreignKey: 'teamId'
})
// Team contains many gamers
Team.belongsToMany(Gamer, {
    through: {
        model: TeamGamer,
        unique: false
    },
    foreignKey: 'teamId'
})
// Gamer can be in several commands
Gamer.belongsToMany(Team, {
    through: {
        model: TeamGamer,
        unique: true
    },
    foreignKey: 'gamerId'
})
// Match has team participants
Match.belongsToMany(Team, {
    through: {
        model: MatchParticipant,
        unique: false,
    },
    foreignKey: 'matchId'
})
// Match has single gamer participants
Match.belongsToMany(Gamer, {
    through: {
        model: MatchParticipant,
        unique: false
    },
    foreignKey: 'matchId'
})
// Team can take part in many matches
Team.belongsToMany(Match, {
    through: {
        model: MatchParticipant,
        unique: true,
    },
    foreignKey: 'teamId'
})
// Gamer can take part in many matches
Gamer.belongsToMany(Match, {
    through: {
        model: MatchParticipant,
        unique: true
    },
    foreignKey: 'gamerId'
})
// One user belongs to the one gamer
Gamer.belongsTo(User, {
    foreignKey: 'userId'
})
// User can have many clients by access token
User.belongsToMany(Client, {
    through: {
        model: AccessToken,
        unique: false
    },
    foreignKey: 'userId'
})
// Some client isn't unique for user by access token
Client.belongsToMany(User, {
    through: {
        model: AccessToken,
        unique: false
    },
    foreignKey: 'clientId'
})
// User can have many clients by refresh token
User.belongsToMany(Client, {
    through: {
        model: RefreshToken,
        unique: false
    },
    foreignKey: 'userId'
})
// Some client isn't unique for user by refresh token
Client.belongsToMany(User, {
    through: {
        model: RefreshToken,
        unique: false
    },
    foreignKey: 'clientId'
})

User.hasMany(Message)
Message.belongsTo(Team, {foreignKey: 'teamId'})

User.hasMany(Conversation);
Conversation.belongsTo(User, { as: 'user1' });
Conversation.belongsTo(User, { as: 'user2' });
Message.belongsTo(Conversation, {
    foreignKey: 'conversationId'
});
Conversation.hasMany(Message);

export {
    Conversation,
    User,
    Message
}