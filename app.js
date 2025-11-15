// --- IMPORTANT ---
// Paste your new Apps Script Web App URL here
const API_URL = "https://script.google.com/macros/s/AKfycbw9HsdlY7057hnfXm06std0bjUecrM4ztlh25M1lxbdOYioP5xbsYNJm33L49aR85vJ6w/exec"; 
let previousStatus = null;
const redProtocol = "EVACUAR";
const redItem1 = "Se emite cuando se detectan rayos dentro del área crítica, entre 0 y 8 km.";
const redItem2 = "La alerta puede activarse directamente en rojo, sin pasar por las anteriores, debido a la topografía y al radio de detección de los equipos.";
const orangeProtocol = "SUSPENDER OPERACIONES"
const orangeItem1 = "Indica caída de rayos en el rango de 8 a 16 km.";
const orangeItem2 = "Todo trabajo de izaje debe detenerse; si hay una carga suspendida, deberá asegurarse en una posición segura.";
const yellowProtocol = "ATENTO A COMUNICACIONES"
const yellowItem1 = "Se activa al detectar rayos entre 16 y 32 km de distancia.";
const yellowItem2 = "Supervisores y trabajadores deben mantener observación constante del cielo y estar atentos a las comunicaciones radiales.";
const greenProtocol = "DESPEJADO"
const greenItem1 = "No se detectan rayos en un radio de 32 km";
const greenItem2 = "Proceder con las labores";

document.addEventListener('DOMContentLoaded', () => {
  
  // Register the service worker for PWA functionality
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  }

  // Click listener for the status card
  const statusCard = document.getElementById('status-card');
  statusCard.addEventListener('click', () => {
    // This tap "unlocks" the vibration API.
    document.getElementById('status-card').style.display = 'none';
    document.getElementById('locations-container').style.display = 'none';
    // --- Correction: typo 'details-container' ---
    document.getElementById('details-container').style.display = 'block';
    
    console.log('Status card tapped, vibration enabled.');
  });
  
  // --- New listener for the "Back" button ---
  const backButton = document.getElementById('back-btn');
  backButton.addEventListener('click', () => {
    // Do the reverse: hide details, show main cards
    document.getElementById('details-container').style.display = 'none';
    document.getElementById('status-card').style.display = 'block';
    
    // Only show locations if it was visible before
    const locationsList = document.getElementById('locations-list');
    if (locationsList.innerHTML !== '') {
      document.getElementById('locations-container').style.display = 'block';
    }
  });
  
  // Load the status immediately
  loadStatus();
});

async function loadStatus() {
  try {
    // Call the API using fetch
    const response = await fetch(`${API_URL}?action=getStatus`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const result = await response.json();
    
    if (result.success) {
      showStatus(result.data);
    } else {
      throw new Error(result.error || 'Failed to parse data');
    }
    
  } catch (error) {
    console.error('Error fetching status:', error);
    showStatus({ status: 'Error', locations: [], lastUpdated: 'No disponible' });
  }
}

function showStatus(data) {
  const status = data.status || 'Error';
  const locations = data.locations || [];
  const lastUpdated = data.lastUpdated || "No disponible";
  
  const statusCard = document.getElementById('status-card');
  const statusDiv = document.getElementById('status');
  const updatedDiv = document.getElementById('last-updated');
  
  // --- Get new detail elements ---
  const detailSiren = document.getElementById('detail-siren-img');
  const detailAlertName = document.getElementById('detail-alert-name'); // New
  const detailActionButton = document.getElementById('detail-action-button'); // New

  const protocolText = document.getElementById('protocol'); // This will now be the first item in the detail-list
  const stormRadiusText = document.getElementById('storm-radius'); // Renamed for clarity
  const detailsText = document.getElementById('details'); // Renamed for clarity

  // 1. Update Status Text
  statusDiv.innerText = status.replace('_', ' ');
  updatedDiv.innerText = "Última actualización: " + lastUpdated;
  
  // 2. Update Status Card Color (for main view)
  statusCard.className = "mini-container status-card"; // Reset classes
  
  // Reset detail view elements before setting new ones
  detailSiren.style.display = 'block'; // Ensure siren is visible
  detailAlertName.className = 'detail-h2'; // Reset text color class
  detailActionButton.className = 'action-button'; // Reset button color class


  if (status == 'ROJA') {
    statusCard.classList.add('status-roja');
    detailAlertName.innerText = "Alerta Roja";
    detailActionButton.innerText = redProtocol;
    detailActionButton.classList.add('red'); // Add red background to button
    detailSiren.src = 'images/Red siren.png';
    protocolText.innerHTML = redItem1;
    stormRadiusText.innerHTML = redItem2; 

    // ONLY vibrate if the status NEWLY changed to ROJA.
    if (status !== previousStatus && 'vibrate' in navigator) {
        navigator.vibrate([500, 100, 500]);
    }
  } 
  else if (status == 'NARANJA') {
    statusCard.classList.add('status-naranja');
    detailAlertName.innerText = "Alerta Naranja";
    detailActionButton.innerText = orangeProtocol;
    detailActionButton.classList.add('orange');
    detailSiren.src = 'images/Orange siren.png';
    protocolText.innerHTML = orangeItem1; 
    stormRadiusText.innerHTML = orangeItem2;
  } 
  else if (status == 'AMARILLA') {
    statusCard.classList.add('status-amarilla');
    detailAlertName.innerText = "Alerta Amarilla";
    detailActionButton.innerText = yellowProtocol;
    detailActionButton.classList.add('yellow');
    detailSiren.src = 'images/Yellow siren.png';
    protocolText.innerHTML = yellowItem1; 
    stormRadiusText.innerHTML = yellowItem2;
  } 
  else if (status == 'TODO DESPEJADO') {
    statusCard.classList.add('status-green');
    detailAlertName.innerText = "Todo Despejado";
    detailActionButton.innerText = greenProtocol;
    detailActionButton.classList.add('green');
    detailSiren.src = 'images/Green siren.png';
    protocolText.innerHTML = greenItem1; 
    stormRadiusText.innerHTML = greenItem2;
  } 
  else if (status == 'PROBANDO') {
    statusCard.classList.add('status-probando');
    detailAlertName.innerText = "Todo despejado";
    detailActionButton.innerText = greenProtocol;
    detailActionButton.classList.add('testing');
    detailSiren.src = 'images/Blue siren.png'; // Assuming you have a blue one
    protocolText.innerHTML = probandoItem1; 
    stormRadiusText.innerHTML = probandoItem2;
  } 
  else {
    statusCard.classList.add('status-error');
    statusDiv.innerText = 'Error al Cargar';
    detailAlertName.innerText = 'Error';
    detailActionButton.innerText = 'Sin Información';
    detailActionButton.classList.add('status-error'); // Use a grey color for error
    detailSiren.style.display = 'none'; // Hide siren on error
    protocolText.innerHTML = "No se pudo cargar la información de la alerta.";
    stormRadiusText.innerHTML = "";
    detailsText.innerHTML = "";
  }

  // 3. Update Locations
  const locationsContainer = document.getElementById('locations-container');
  const locationsList = document.getElementById('locations-list');
  
  // --- ADD THIS LINE ---
  // Get the details container to check if it's visible
  const detailsContainer = document.getElementById('details-container');
  
  locationsList.innerHTML = ''; 
  
  if (locations.length > 0) {
    locations.forEach((loc) => {
      const li = document.createElement('li');
      li.textContent = loc;
      locationsList.appendChild(li);
    });

    // --- MODIFIED CONDITION ---
    // Only show locations if there are locations AND the details view is hidden.
    if (detailsContainer.style.display === 'none') {
      locationsContainer.style.display = 'block';
    }
  } else {
    locationsContainer.style.display = 'none';
  }
  
  // 4. Auto-refresh
  setTimeout(loadStatus, 10000); // 10 seconds
}