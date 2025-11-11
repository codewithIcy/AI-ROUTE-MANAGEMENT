import express from "express"
import cors from "cors"
import cp from "cookie-parser"
import router from "./api/routes/router.js"

const app = express()
const PORT = 3250

app.set("view engine", "ejs")
app.use(cors())
app.use(express.json())
app.use(express.static("assets"))
app.use(express.urlencoded({extended: true}))
app.use(cp())
app.use('/', router)
app.use((req, res)=>{
    res.status(404).json({error: "not found"})
})


app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}...`)
})