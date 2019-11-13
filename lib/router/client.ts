import express from 'express';
import ClientModel from '../model/client';

const router = express.Router();

router.post('/', (req, res) => {    
    ClientModel.create(req.body).then(client => res.send(client));
});
router.get('/:id', (req, res) => {    
    ClientModel.findOne({where: {
        id: req.params.id
    }}).then(client => res.send(client));
});
router.delete('/:id', (req, res) => {    
    ClientModel.destroy({where: {
        id: req.params.id
    }}).then(number => res.send({number}));
});

export default router;
