import express, { json } from "express"
import navRoute from "../../routing_engine/route.calculator.js"
import controller from "../controllers/controller.js"

const router = express.Router()


router.get('/:page',(req, res, next)=>{
    const page = req.params.page
    if(page==="favicon.ico"){
        res.status(404).json()
        return
    }
    console.log('firstcall')
    res.render('main', {pageTitle: page})
})

router.post('/route', async(req, res, next)=>{
    const payload = req.body
    console.log(payload)
    const response = await navRoute.getCoodrinates(payload.payload)

    if(response){
        console.log(response)
        res.json(response)
    }
    else{
        res.status(400).json()
    }
})

export default router