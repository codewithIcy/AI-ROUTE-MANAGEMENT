const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

let markers = [];
let routeLine = null;

const map = L.map('map').setView([-1.2921, 36.8219], 12)
const routeInfo = document.getElementById('route-info');


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
    document.getElementById('route-err').innerText = "Loading please wait..."

    const response = await fetch('/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({payload})
    });

    if (response.ok) {
    document.getElementById('route-err').innerText = ""
      const map_data = await response.json();
      console.log(map_data.start);


      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      console.log(map_data)
      displayRoute(map_data)


    } else {
      document.getElementById('route-err').innerText = "Error: location not found";
      document.getElementById('route-err').style.color = "red"
    }
  } catch (err) {
    console.error(err);
    document.getElementById('route-err').innerText = "Network error. Try again.";
    document.getElementById('route-err').style.color = "red"
  }
});

function displayRoute(data) {
    clearMap();    
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
            <div class="route-info" style="color: white">
                <h3>Route Information</h3>
                <p id="distance"><strong>Distance:</strong> ${data.distance}</p>
                <p><strong>Duration:</strong> ${Math.floor(parseInt(data.duration)/60)}h ${parseInt(data.duration) % 60}min</p>
                <p><strong>From:</strong> ${document.getElementById("start_addr").value}</p>
                <p><strong>To:</strong> ${document.getElementById('destination').value}</p>`
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

document.getElementById('log-but').addEventListener('click', async(e)=>{
  e.preventDefault()

  document.getElementById('log-err').innerText = "Loading please wait..."
  const response = await fetch('/log', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      route: document.getElementById("start_addr").value + document.getElementById("destination").value,
      fuel: document.getElementsById('fuel').value,
      accomodation: document.getElementsById('accomodation').value,
    })
  })
  if(response.ok){
    document.getElementById('log-err').innerText = ""
  }
  else{
    const data = await response.json()
    document.getElementById('log-err').innerText = data.error
  }
  
})