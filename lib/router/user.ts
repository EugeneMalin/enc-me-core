import express, { Request, Response } from 'express';
import UserModel from '../model/user';
import passport from 'passport';

const router = express.Router();

const DEFAULT_USER_CHECK = (req: Request, res: Response) => {
    if (!req.user) {
        return res.send('There is no user');
    }
    //@ts-ignore
    if (!req.param.id !== req.user.id) {
        return res.send('You can manipulate only with yourself')
    }
}

router.get('/', passport.authenticate('bearer', {session: false}), DEFAULT_USER_CHECK, (req, res) => {    
    UserModel.findAll({where: req.body.filter}).then(users => res.send(users));
});
router.post('/', (req, res) => {    
    UserModel.create(req.body).then(user => res.send(user));
});
router.get('/:id', DEFAULT_USER_CHECK, (req, res) => {    
    UserModel.findOne({where: {
        id: req.params.id
    }}).then(user => res.send(user));
});
router.put('/:id', passport.authenticate('bearer', {session: false}),
DEFAULT_USER_CHECK, (req, res) => {    
    UserModel.update(req.body, {where: {
        id: req.params.id
    }}).then(([number, users]) => res.send({number, users}));
});
router.delete('/:id', passport.authenticate('bearer', {session: false}),
DEFAULT_USER_CHECK, (req, res, next) => {    
    UserModel.destroy({where: {
        id: req.params.id
    }}).then(number => res.send({number}));
});

export default router;
