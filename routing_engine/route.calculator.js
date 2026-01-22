import dotenv from 'dotenv'
import openRouteServies from 'openrouteservice-js'

dotenv.config()
const AUTH_KEY = process.env.MAP_KEY
const client = new openRouteServies.Geocode({api_key: AUTH_KEY})
const directions = new openRouteServies.Directions({api_key: AUTH_KEY})

export default class navRoute {
    static async getCoodrinates(location) {
        try {
            console.log("Looking up: ", location)
            const res_coordinates = await client.geocode({ text: location, size: 3 })

            if (!res_coordinates.features || res_coordinates.features.length === 0) {
                throw new Error(`Location not found: ${location}`)
            }

            return res_coordinates.features[0].geometry.coordinates
        } catch (error) {
            console.error('Geocoding error:', error)
            throw error
        }
    }

    static async getRoutes(routecoordinates, options = {}) {
        try {
            const {
                alternativeRoutes = 3,
                returnAllRoutes = true
            } = options;

            console.log('Calculating route with coordinates:', routecoordinates);

            // Build the request parameters
            const requestParams = {
                coordinates: [
                    [routecoordinates.start[0], routecoordinates.start[1]],
                    [routecoordinates.dest[0], routecoordinates.dest[1]]
                ],
                profile: 'driving-car',
                format: 'geojson',
                instructions: true,
                language: 'en'
            };

            // Only add alternative_routes if we want multiple routes
            if (alternativeRoutes > 1) {
                requestParams.alternative_routes = {
                    target_count: alternativeRoutes,
                    weight_factor: 1.4,
                    share_factor: 0.6
                };
            }

            console.log('Request params:', JSON.stringify(requestParams, null, 2));

            let response;
            
            // --- FIXED: Fallback logic for long distance routes ---
            try {
                response = await directions.calculate(requestParams);
            } catch (calcError) {
                // Check if the error is likely due to the alternative routes limit (Error 2004 or Status 400)
                // ORS throws 400 Bad Request when the distance exceeds 150km with alternatives enabled
                if (requestParams.alternative_routes && (calcError.status === 400 || (calcError.message && calcError.message.includes('Bad Request')))) {
                    console.warn('⚠️ Route limit exceeded (Code 2004). Retrying without alternative routes (Nairobi-Mombasa is >150km)...');
                    
                    // Remove the alternative_routes parameter causing the issue
                    delete requestParams.alternative_routes;
                    
                    // Retry the calculation
                    response = await directions.calculate(requestParams);
                } else {
                    // If it's not a recoverable error, rethrow it to be caught by the outer block
                    throw calcError;
                }
            }
            // ----------------------------------------------------

            console.log('Response type:', response.type);
            console.log('Number of routes found:', response.features?.length || 0);

            if (!response || !response.features || response.features.length === 0) {
                throw new Error('No routes found in response');
            }

            // Process all routes
            const routes = response.features.map((route, index) => {
                const summary = route.properties.summary;

                return {
                    routeIndex: index,
                    isPrimary: index === 0,
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
                    distanceValue: summary.distance,
                    duration: Math.round(summary.duration / 60) + ' minutes',
                    durationValue: summary.duration,
                    coordinates: route.geometry.coordinates.map(coord => ({
                        lat: coord[1],
                        lng: coord[0]
                    })),
                    steps: route.properties.segments[0].steps.map(step => ({
                        instruction: step.instruction,
                        distance: (step.distance / 1000).toFixed(2) + ' km',
                        duration: Math.round(step.duration / 60) + ' min'
                    }))
                };
            });

            // Return all routes or just the primary one based on option
            if (returnAllRoutes) {
                return {
                    routes: routes,
                    routeCount: routes.length,
                    primaryRoute: routes[0]
                };
            } else {
                return routes[0];
            }

        } catch (error) {
            console.error('Route calculation error:', error.message);
            console.error('Full error:', error);

            // Try to extract more detailed error information
            if (error.response) {
                try {
                    // Note: If the body was already consumed by the library, this might fail, 
                    // but it's worth a try for debugging
                    if (!error.response.bodyUsed) {
                        const errorBody = await error.response.json();
                        console.error('API Error Details:', errorBody);
                    }
                } catch (e) {
                    // Response body couldn't be parsed
                }
            }

            throw error;
        }
    }

    static async getMatrixRoute(locations) {
        try {
            const matrix = new openRouteServies.Matrix({ api_key: AUTH_KEY })

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