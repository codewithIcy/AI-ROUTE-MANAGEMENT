let rowCounter = 0;
let trash = []
let data


// Add a new row to the table
function addRow() {
    const tbody = document.querySelector('#input-table tbody');
    const row = document.createElement('tr');
    row.dataset.id = rowCounter++;

    row.innerHTML = `
        <td><input type="text" placeholder="Vehice Plate" /></td>
        <td>
            <select>
                <option value="">Select Type</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Car">Car</option>
                <option value="Pickup">Pickup</option>
                <option value="Truck">Truck</option>
                <option value="Large Truck">Large Truck</option>
            </select>
        </td>
        <td><input type="text" placeholder="Trip" /></td>
        <td><input type="number" placeholder="Fuel" /></td>
        <td><input type="number" placeholder="Accomodation" readonly/></td>
        <td class="delete-cell">
            <button class="btn-delete" onclick="deleteRow(this)">Delete</button>
        </td>
    `;

    tbody.appendChild(row);
}

// Delete a specific row
function deleteRow(button) {
    const row = button.closest('tr');
    const cell = row.querySelectorAll('input, select');
    trash.push(cell[0].value)
    console.log(trash)
    row.remove();
}

// Populate table from JSON array
function populateTable(jsonData) {
    const tbody = document.querySelector('#input-table tbody');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Populate with new data
    jsonData.forEach((item) => {
        const row = document.createElement('tr');
        row.dataset.id = rowCounter++;

        row.innerHTML = `
            <td><input type="text" ${item.plate ? `value="${item.plate}"` : 'placeholder="Vehicle Plate"'} /></td>
        <td>
            <select>
                <option value="">Select Type</option>
                <option value="Motorcycle" ${item.type === "Motorcycle"? "selected" : ''}>Motorcycle</option>
                <option value="Car" ${item.type === "Car" ? "selected" : ''}>Car</option>
                <option value="Pickup" ${item.type === "Pickup" ? "selected" : ''}>Pickup</option>
                <option value="Truck" ${item.type === "Truck" ? "selected" : ''}>Truck</option>
                <option value="Large Truck" ${item.type === "Large Truck" ? "selected" : ''}>Large Truck</option>
            </select>
        </td>
        <td><input type="text" ${item.route? 'value=' + item.route : 'placeholder="Trip"'} /></td>
        <td><input type="number" ${item.fuel? 'value=' + '"' + item.fuel + '"' : 'placeholder="Fuel"'} /></td>
        <td><input type="number" ${item.accomodation ? 'value=' + '"' + (item.accomodation) + '"' : 'placeholder="accomodation"'}/></td>
        <td class="delete-cell">
            <button class="btn-delete" onclick="deleteRow(this)">Delete</button>
        </td>`

        tbody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', async(e)=>{
    const response = await fetch('/recent-trips')

    if(response.ok){
        data = await response.json()
        console.log(data)

        const tbody = document.querySelector('#input-table tbody');
        tbody.innerHTML = '';

        populateTable(data)
    }
    else{
        alert("Error: Failed to fetch user data")
    }
    
})

function toNumber(val) {
    if (val === null || val === undefined) return '';
    const n = String(val).replace(/[^0-9.]/g, '');
    return n === '' ? '' : n;
}


addRow()