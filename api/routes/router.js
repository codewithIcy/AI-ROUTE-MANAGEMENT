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
    const start  = await navRoute.getCoodrinates(payload.payload.start)
    const dest  = await navRoute.getCoodrinates(payload.payload.dest)

    const response = {
        start,
        dest
    }

    if(response){
        console.log(response)
        const route = await navRoute.getRoutes(response)
        console.log(route)
        res.json(route)
    }
    else{
        res.status(400).json()
    }
})

router.post('/log', async(req, res)=>{
    console.log(req.body)
    const {route, fuel, accomodation} = req.body
    if(!accomodation || !route || !fuel){
        return res.status(500).json({error: "Please fill the required fields"})
    }
    const result = await controller.postRouteLog(route, fuel, accomodation)
    if(result){
        res.json(result)
    }
    else{
        res.status(500).json({error: "Failed, internal server error"})
    }
})

export default router