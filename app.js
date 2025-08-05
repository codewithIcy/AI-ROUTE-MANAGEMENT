import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cp from "cookie-parser"

dotenv.config()

const app = express()

app.set("view engine", "ejs")
app.use(cors())
app.use(express.json())
app.use(express.static("assets"))
app.use(express.urlencoded({extended: true}))