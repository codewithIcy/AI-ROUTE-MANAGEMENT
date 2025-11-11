import dotenv from 'dotenv'
import openRouteServies from 'openrouteservice-js'


dotenv.config()
const AUTH_KEY = process.env.MAP_KEY
const client = new openRouteServies.Geocode({api_key: AUTH_KEY})

export default class navRoute{
    static async getCoodrinates(location){
        const res_coordinates = await client.geocode({text: location, size: 3})
        return res_coordinates.features[0].geometry.coordinates
    }
    static async getRoutes(){
    }
    static async getMatrixRoute(){

    }
}