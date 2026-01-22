import express, { json } from "express"
import navRoute from "../../routing_engine/route.calculator.js"
import controller from "../controllers/controller.js"

const router = express.Router()

router.get("/recent-trips", async(req, res)=>{
    const trips = await controller.getTrips()
    res.json(trips)
})

router.get('/:page',(req, res, next)=>{
    const page = req.params.page
    if(page==="favicon.ico"){
        res.status(404).json()
        return
    }
    console.log('firstcall')
    res.render('main', {pageTitle: page})
})

router.post('/route', async (req, res, next) => {
    try {
        const payload = req.body;
        console.log('Incoming payload:', payload);

        // Handle the nested structure seen in your logs: { payload: { start: '...', dest: '...' } }
        // Also supports direct { start: '...', dest: '...' } for flexibility
        const routeRequest = payload.payload || payload;

        if (!routeRequest.start || !routeRequest.dest) {
             return res.status(400).json({
                success: false,
                error: 'Missing start or destination in payload'
            });
        }

        // Note: Using 'getCoodrinates' (matching the typo in route.calculator.js)
        const start = await navRoute.getCoodrinates(routeRequest.start);
        const dest = await navRoute.getCoodrinates(routeRequest.dest);

        const response = {
            start,
            dest
        };

        if (response && response.start && response.dest) {
            console.log('Coordinates found:', response);

            // Get routes
            // If the distance is >150km (like Nairobi->Mombasa), the updated navRoute 
            // will automatically fallback to 1 route to prevent the API 400 error.
            const routeData = await navRoute.getRoutes(response, {
                alternativeRoutes: 3,  // Request 3 alternatives if possible
                returnAllRoutes: true  // Return object structure with routes array
            });

            console.log(`Found ${routeData.routeCount} routes`);

            // Log summary of all routes
            routeData.routes.forEach((route, index) => {
                console.log(`Route ${index + 1}: ${route.distance}, ${route.duration}`);
            });

            res.json({
                success: true,
                routeCount: routeData.routeCount,
                routes: routeData.routes,
                primaryRoute: routeData.primaryRoute,
                // Metadata about the request
                request: {
                    start: routeRequest.start,
                    dest: routeRequest.dest
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Could not find coordinates for start or destination',
                details: {
                    startFound: !!response.start,
                    destFound: !!response.dest
                }
            });
        }
    } catch (error) {
        console.error('Route endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate routes',
            message: error.message
        });
    }
});

router.post('/log', async(req, res)=>{
    console.log(req.body)
    const {route, fuel, accomodation, type, plate, distance} = req.body
    const result = await controller.postRouteLog(route, fuel, accomodation, type, plate, distance)
    if(result){
        res.json(result)
    }
    else{
        res.status(500).json({error: "Failed, internal server error"})
    }
})

export default router