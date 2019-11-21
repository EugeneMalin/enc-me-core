import express from 'express';
import ClientModel from '../model/client';

const router = express.Router();

router.post('/', (req, res) => {    
    ClientModel.findOrCreate({where: req.body}).then(client => res.send(client)).catch(e => {
        res.send({
            error: true,
            errorDetails: e.message
        })
    });
});
router.delete('/', (req, res) => {    
    ClientModel.destroy({where: {
        name: req.body.name
    }}).then(number => res.send({number}));
});

export default router;
