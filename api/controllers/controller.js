import appDao from '../DAO/appDAO.js'

export default class appConttroller{
    static async postRouteLog(route, fuel, accomodation, type, plate, distance){
        const response = await appDao.uploadTrip(route, fuel, accomodation, type, plate, distance)
        if(response){
            return {message: "Success"}
        }
        else{
            return null
        }
    }
    static async getTrips(){
        const result = await appDao.getTrips()
        return result
    }
}