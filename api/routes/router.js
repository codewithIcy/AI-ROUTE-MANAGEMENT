import express from "express"
import navRoute from "../../routing_engine/route.calculator.js"
import controller from "../controllers/controller.js"

const router = express.Router()

router.get('/', (req, res)=>{
    navRoute.getCoodrinates()
    res.render('main')
})

export default router