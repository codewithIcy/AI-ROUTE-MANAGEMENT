import dotenv from 'dotenv'

dotenv.config()

const AUTH_KEY = process.env.MAP_KEY

export default class navRoute{
    static async getCoodrinates(){
        console.log(AUTH_KEY)
    }
    static async getRoutes(){
    }
    static async getMatrixRoute(){

    }
}