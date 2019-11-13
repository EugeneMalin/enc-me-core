import express from 'express';
import MatchModel from '../model/match';
import passport from 'passport';

const router = express.Router();

router.get('/', (req, res) => {    
    MatchModel.findAll().then(matches => res.send(matches));
});
router.post('/', passport.authenticate('bearer', {session: false}),  (req, res) => {    
    MatchModel.create(req.body).then(match => res.send(match));
});
router.get('/:id', (req, res) => {    
    MatchModel.findOne({where: {
        id: req.params.id
    }}).then(match => res.send(match));
});
router.put('/:id', passport.authenticate('bearer', {session: false}), (req, res) => {    
    MatchModel.update(req.body, {where: {
        id: req.params.id
    }}).then(([number, matches]) => res.send({number, matches}));
});
router.delete('/:id', passport.authenticate('bearer', {session: false}), (req, res) => {    
    MatchModel.destroy({where: {
        id: req.params.id
    }}).then(number => res.send({number}));
});

export default router;
