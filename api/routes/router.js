import express from "express"
import navRoute from "../../routing_engine/route.calculator.js"
import controller from "../controllers/controller.js"

const router = express.Router()


router.get('/:page',(req, res)=>{
    const page = req.params.page
    res.render('main', {pageTitle: page})
})

export default router