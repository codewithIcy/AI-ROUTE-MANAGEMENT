import appDao from '../DAO/appDAO.js'

export default class appConttroller{
    static async postRouteLog(route, fuel, accomodation){
        const response = await appDao.uploadTrip(route, fuel, accomodation)
        if(response){
            return {message: "Success"}
        }
        else{
            return null
        }
    }
}