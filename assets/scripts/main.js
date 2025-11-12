const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

let markers = [];
let routeLine = null;

const map = L.map('map').setView([-1.2921, 36.8219], 12)


function toggleSidebar() {
  sidebar.classList.toggle('close');
  toggleButton.classList.toggle('rotate');
  closeAllSubMenus();
}

function toggleSubMenu(button) {
  if (!button.nextElementSibling.classList.contains('show')) {
    closeAllSubMenus();
  }

  button.nextElementSibling.classList.toggle('show');
  button.classList.toggle('rotate');

  if (sidebar.classList.contains('close')) {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');
  }
}

function closeAllSubMenus() {
  Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
    ul.classList.remove('show');
    ul.previousElementSibling.classList.remove('rotate');
  });
}

document.getElementById('sub-but').addEventListener('click', async (e) => {
  e.preventDefault();

  const payload = {
    start: document.getElementById('start_addr').value,
    dest: document.getElementById('destination').value
  };

  try {
    const response = await fetch('/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({payload})
    });

    if (response.ok) {
      const map_data = await response.json();
      console.log(map_data.start);


      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      console.log(map_data)
      displayRoute(map_data)


    } else {
      document.getElementById('error-msg').innerText = "Error: location not found";
    }
  } catch (err) {
    console.error(err);
    document.getElementById('error-msg').innerText = "Network error. Try again.";
  }
});

function displayRoute(data) {
    clearMap();
    
    const routeInfo = document.getElementById('route-info');
    
    // Use data.start and data.end instead of data.from and data.to
    const startMarker = L.marker([data.start.coordinates.lat, data.start.coordinates.lng])
        .addTo(map)
        .bindPopup(`<b>Start:</b><br>${data.start.name}`)
        .openPopup();
    markers.push(startMarker);

    const endMarker = L.marker([data.end.coordinates.lat, data.end.coordinates.lng])
        .addTo(map)
        .bindPopup(`<b>End:</b><br>${data.end.name}`);
    markers.push(endMarker);

    const routeCoords = data.coordinates.map(coord => [coord.lat, coord.lng]);
    routeLine = L.polyline(routeCoords, {
        color: '#2196F3',
        weight: 5,
        opacity: 0.7
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    if (routeInfo) {
        routeInfo.innerHTML = `
            <div class="route-info">
                <h3>Route Information</h3>
                <p><strong>Distance:</strong> ${data.distance}</p>
                <p><strong>Duration:</strong> ${data.duration}</p>
                <p><strong>From:</strong> ${data.start.name}</p>
                <p><strong>To:</strong> ${data.end.name}</p>
                
                <h4 style="margin-top: 15px;">Turn-by-turn Directions:</h4>
                <div class="steps">
                    ${data.steps.map((step, i) => `
                        <div class="step">
                            ${i + 1}. ${step.instruction} <em>(${step.distance})</em>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

 function clearMap() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    
    routeInfo.innerHTML = '';
}