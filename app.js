import express from "express"
import cors from "cors"
import cp from "cookie-parser"

const app = express()
const PORT = 3250

app.set("view engine", "ejs")
app.use(cors())
app.use(express.json())
app.use(express.static("assets"))
app.use(express.urlencoded({extended: true}))
app.use(cp())


app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}...`)
})