import dotenv from 'dotenv'
import openRouteServies from 'openrouteservice-js'

dotenv.config()
const AUTH_KEY = process.env.MAP_KEY
const client = new openRouteServies.Geocode({api_key: AUTH_KEY})
const directions = new openRouteServies.Directions({api_key: AUTH_KEY})

export default class navRoute{
    static async getCoodrinates(location){
        try {
            console.log("Looking up: ", location)
            const res_coordinates = await client.geocode({text: location, size: 3})
            
            if (!res_coordinates.features || res_coordinates.features.length === 0) {
                throw new Error(`Location not found: ${location}`)
            }
            
            return res_coordinates.features[0].geometry.coordinates
        } catch (error) {
            console.error('Geocoding error:', error)
            throw error
        }
    }
    
    static async getRoutes(routecoordinates){
    try {
            console.log('Calculating route with coordinates:', routecoordinates)
            
            const response = await directions.calculate({
                coordinates: [
                    [routecoordinates.start[0], routecoordinates.start[1]],
                    [routecoordinates.dest[0], routecoordinates.dest[1]]
                ],
                profile: 'driving-car',
                format: 'geojson',  // ✅ Change to geojson instead of json
                instructions: true,
                language: 'en'
            })
            
            console.log('Response type:', response.type)
            
            if (!response || !response.features || response.features.length === 0) {
                throw new Error('No routes found in response')
            }
            
            const route = response.features[0]
            const summary = route.properties.summary
            

            return {
                start: {
                    name: 'Start',
                    coordinates: {
                        lat: routecoordinates.start[1],
                        lng: routecoordinates.start[0]
                    }
                },
                end: {
                    name: 'End',
                    coordinates: {
                        lat: routecoordinates.dest[1],
                        lng: routecoordinates.dest[0]
                    }
                },
                distance: (summary.distance / 1000).toFixed(2) + ' km',
                duration: Math.round(summary.duration / 60) + ' minutes',
                coordinates: route.geometry.coordinates.map(coord => ({
                    lat: coord[1],
                    lng: coord[0]
                })),
                steps: route.properties.segments[0].steps.map(step => ({
                    instruction: step.instruction,
                    distance: (step.distance / 1000).toFixed(2) + ' km',
                    duration: Math.round(step.duration / 60) + ' min'
                }))
            }
        } catch (error) {
            console.error('Route calculation error:', error.message)
            console.error('Full error:', error)
            throw error
        }
    }
    
    static async getMatrixRoute(locations){
        try {
            const matrix = new openRouteServies.Matrix({api_key: AUTH_KEY})
            
            const response = await matrix.calculate({
                locations: locations,
                profile: 'driving-car',
                metrics: ['distance', 'duration']
            })
            
            return response
        } catch (error) {
            console.error('Matrix calculation error:', error)
            throw error
        }
    }
}