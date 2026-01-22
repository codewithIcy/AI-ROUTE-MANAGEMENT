const map = L.map('map').setView([-1.2921, 36.8219], 12); // Default to Nairobi
let routeDistance;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- State Management ---
let routeLayers = [];
let markers = [];
let currentRouteData = null; // Store the full API response

// --- ML Model State (Linear Regression) ---
let modelFuel = { m: 0.1, c: 0 }; 
let modelAccom = { m: 0.05, c: 500 };
let isTrained = false;

// --- ML Functions ---

async function trainModels() {
    try {
        const response = await fetch('/recent-trips');
        if (!response.ok) return;
        const trips = await response.json();
        if (trips.length < 2) return; 

        // Prepare data based on updated schema: "51.86 km" -> 51.86
        const data = trips.map(t => {
            let distNum = 50; // Default
            if (t.distance) {
                distNum = parseFloat(t.distance.replace(/[^\d.]/g, ''));
            }
            return {
                x: distNum,
                yFuel: t.fuel || 0,
                yAccom: t.accomodation || 0
            };
        });

        const learningRate = 0.00001; // Slightly lower for better stability
        const epochs = 1500;

        let mF = 0.1, cF = 0;
        let mA = 0.05, cA = 200;

        for (let i = 0; i < epochs; i++) {
            data.forEach(p => {
                // Fuel
                let errorF = p.yFuel - (mF * p.x + cF);
                mF += errorF * p.x * learningRate;
                cF += errorF * learningRate;

                // Accom
                let errorA = p.yAccom - (mA * p.x + cA);
                mA += errorA * p.x * learningRate;
                cA += errorA * learningRate;
            });
        }

        modelFuel = { m: mF, c: cF };
        modelAccom = { m: mA, c: cA };
        isTrained = true;
        console.log("ML Models Trained on new schema:", { modelFuel, modelAccom });

    } catch (e) {
        console.error("ML Training failed", e);
    }
}

function predictCosts(distanceKm) {
    const predFuel = Math.max(0, modelFuel.m * distanceKm + modelFuel.c);
    const predAccom = Math.max(0, modelAccom.m * distanceKm + modelAccom.c);
    return { fuel: predFuel.toFixed(2), accomodation: predAccom.toFixed(2) };
}

// --- UI & Mapping Functions ---

const routeInfo = document.getElementById('route-info');
const routeControls = document.getElementById('route-controls');
const routeErr = document.getElementById('route-err');

function clearMap() {
    // Remove all route lines
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    
    // Remove markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    routeInfo.innerHTML = '';
}

// Helper to format duration
function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// Function to render routes on the map
function renderMap(mode, selectedIndex = 0) {
    clearMap();

    if (!currentRouteData || !currentRouteData.routes || currentRouteData.routes.length === 0) return;

    const routes = currentRouteData.routes;
    // Use the selected route for coordinates
    const selectedRoute = routes[selectedIndex];

    // 1. Add Start/End Markers
    if (selectedRoute.start && selectedRoute.start.coordinates) {
        const startMarker = L.marker([selectedRoute.start.coordinates.lat, selectedRoute.start.coordinates.lng])
            .addTo(map)
            .bindPopup(`<b>Start:</b><br>${selectedRoute.start.name}`)
            .openPopup();
        markers.push(startMarker);
    }

    if (selectedRoute.end && selectedRoute.end.coordinates) {
        const endMarker = L.marker([selectedRoute.end.coordinates.lat, selectedRoute.end.coordinates.lng])
            .addTo(map)
            .bindPopup(`<b>End:</b><br>${selectedRoute.end.name}`);
        markers.push(endMarker);
    }

    // 2. Draw Routes
    if (mode === 'all') {
        routes.forEach((route, idx) => {
            const isSelected = idx === selectedIndex;
            const color = isSelected ? '#2196F3' : '#dd4646';
            const weight = isSelected ? 6 : 4;
            const opacity = isSelected ? 1.0 : 0.6;
            const dashArray = isSelected ? null : '5, 10';

            if (route.coordinates) {
                const routeCoords = route.coordinates.map(coord => [coord.lat, coord.lng]);
                const polyline = L.polyline(routeCoords, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    dashArray: dashArray,
                    zIndexOffset: isSelected ? 1000 : 0
                }).addTo(map);

                polyline.bindTooltip(`Route ${idx + 1}: ${route.distance}, ${route.duration}`, { sticky: true });
                polyline.on('click', () => updateUI(mode, idx));
                routeLayers.push(polyline);
            }
        });
    } else {
        if (selectedRoute.coordinates) {
            const routeCoords = selectedRoute.coordinates.map(coord => [coord.lat, coord.lng]);
            const polyline = L.polyline(routeCoords, {
                color: '#2196F3',
                weight: 6,
                opacity: 1.0
            }).addTo(map);
            routeLayers.push(polyline);
        }
    }

    // 3. Fit Bounds
    if (routeLayers.length > 0 || markers.length > 0) {
        const group = new L.featureGroup([...routeLayers, ...markers]);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    // 4. ML Prediction Calculation
    const distKm = parseFloat(selectedRoute.distance.replace(/[^\d.]/g, '')) || 0;
    const predictions = predictCosts(distKm);

    // 5. Update Info Panel
    routeInfo.innerHTML = `
        <div class="route-details">
            <h3>Route ${selectedIndex + 1} Analysis</h3>
            <p><strong>Distance:</strong> ${selectedRoute.distance}</p>
            <p><strong>Duration:</strong> ${selectedRoute.duration}</p>
            <p><strong>Start:</strong> ${document.getElementById("start_addr").value}</p>
            <p><strong>Dest:</strong> ${document.getElementById('destination').value}</p>
            
            <div class="cost-box">
                <h4>ML Predictions <span class="ml-badge">${isTrained ? 'Trained' : 'Default'}</span></h4>
                <p>⛽ <strong>Estimated Fuel:</strong> Ksh ${predictions.fuel}</p>
                <p>🏨 <strong>Estimated Accomodation:</strong> Ksh ${predictions.accomodation}</p>
                <small style="opacity: 0.7">* Estimates refined from past logs.</small>
            </div>
        </div>
    `;
    routeDistance = selectedRoute.distance;
}

function updateUI(mode, selectedIndex) {
    renderMap(mode, selectedIndex);
    generateControls(mode, selectedIndex);
}

function generateControls(currentMode, selectedIndex) {
    routeControls.innerHTML = '';
    routeControls.style.display = 'block';

    const label = document.createElement('h4');
    label.innerText = `Found ${currentRouteData.routeCount} Routes:`;
    label.style.marginTop = '0';
    routeControls.appendChild(label);

    const allBtn = document.createElement('button');
    allBtn.innerText = "Show All Overview";
    allBtn.className = `route-btn ${currentMode === 'all' ? 'active' : ''}`;
    allBtn.onclick = () => updateUI('all', selectedIndex);
    routeControls.appendChild(allBtn);

    currentRouteData.routes.forEach((route, idx) => {
        const btn = document.createElement('button');
        btn.innerText = `Route ${idx + 1} (${route.distance})`;
        const isActive = idx === selectedIndex && currentMode === 'single';
        const isHighlighted = idx === selectedIndex && currentMode === 'all';
        
        if (isActive) btn.classList.add('active');
        if (isHighlighted) btn.style.border = "2px solid #2196F3";

        btn.onclick = () => updateUI('single', idx);
        routeControls.appendChild(btn);
    });
}

document.getElementById('sub-but').addEventListener('click', async (e) => {
    e.preventDefault();

    const startVal = document.getElementById('start_addr').value;
    const destVal = document.getElementById('destination').value;

    if(!startVal || !destVal) {
        routeErr.innerText = "Please fill in both fields";
        routeErr.className = "text-red";
        return;
    }

    try {
        routeErr.innerText = "Optimizing ML predictions and calculating routes...";
        routeErr.className = "";
        routeControls.style.display = 'none';

        await trainModels(); // Retrain with latest trip history

        const response = await fetch('/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: { start: startVal, dest: destVal } })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            routeErr.innerText = "";
            currentRouteData = data;
            updateUI('all', 0);
        } else {
            routeErr.innerText = `Error: ${data.error || 'Location not found'}`;
            routeErr.className = "text-red";
            clearMap();
        }
    } catch (err) {
        console.error(err);
        routeErr.innerText = "Network error. Is the server running?";
        routeErr.className = "text-red";
    }
});

document.getElementById('log-but').addEventListener('click', async(e)=>{
    e.preventDefault();
    const logErr = document.getElementById('log-err');
    logErr.innerText = "Sending log...";
    
    try {
        const response = await fetch('/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route: document.getElementById("start_addr").value + " to " + document.getElementById("destination").value,
                fuel: parseFloat(document.getElementById('fuel').value),
                accomodation: parseFloat(document.getElementById('accomodation').value),
                type: document.getElementById('type').value,
                plate: document.getElementById('plate').value,
                distance: routeDistance
            })
        });
        
        if(response.ok){
            logErr.innerText = "Log saved successfully! ML model will improve.";
            logErr.style.color = "green";
            document.getElementById('log-form').reset();
            trainModels(); // Refresh model in background
        } else {
            const data = await response.json();
            logErr.innerText = data.error || "Failed to log";
            logErr.className = "text-red";
        }
    } catch (error) {
        logErr.innerText = "Network Error";
        logErr.className = "text-red";
    }
});

// Initial train on load
trainModels();