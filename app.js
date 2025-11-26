// --- IMPORTANT ---
const API_URL = "https://script.google.com/macros/s/AKfycbyHuAJrztW7wPzWYDya34NnoSiXomBYhQeBB9XqA6lmMFY1ShL7fcI8y-S_9ryDzxDAtA/exec";
const alertSound = new Audio('sounds/alarm.mp3');

// --- ONESIGNAL BLOCK ---
window.OneSignalDeferred = window.OneSignalDeferred || [];
window.OneSignalDeferred.push(function(OneSignal) {
  OneSignal.init({
    appId: "023dcf63-6116-46d1-ad20-4eb1d83b3c52", // Your App ID
    safari_web_id: "", 
    notifyButton: {
      enable: true, 
    },
    allowLocalhostAsSecureOrigin: true,
    
    // --- CRITICAL FIX ---
    serviceWorkerPath: 'sw.js',
    // -------------------
  });
});
// --- END BLOCK ---

let previousStatus = null;

// --- Define all text content ---
const redProtocol = "EVACUAR";
const redItem1 = "Se emite cuando se detectan rayos dentro del área crítica, entre 0 y 8 km.";
const redItem2 = "Se suspenden inmediatamente todos los trabajos al aire libre y el personal debe dirigirse a los refugios identificados";

const orangeProtocol = "SUSPENDER OPERACIONES";
const orangeItem1 = "Indica caída de rayos en el rango de 8 a 16 km.";
const orangeItem2 = "Todo trabajo de izaje debe detenerse; si hay una carga suspendida, deberá asegurarse en una posición segura.";

const yellowProtocol = "ATENTO A COMUNICACIONES";
const yellowItem1 = "Se activa al detectar rayos entre 16 y 32 km de distancia.";
const yellowItem2 = "Supervisores y trabajadores deben mantener observación constante del cielo y estar atentos a las comunicaciones radiales.";

const greenProtocol = "RESUMIR LABORES";
const greenItem1 = "No se detectan rayos en un radio de 32 km";
const greenItem2 = "Continuar con las operaciones, no se requiere ninguna acción";

const probandoProtocol = "PRUEBA";
const probandoItem1 = "Esta es una alerta de prueba del sistema.";
const probandoItem2 = "Continuar con las operaciones, no se requiere ninguna acción";


document.addEventListener('DOMContentLoaded', () => {
  
  // Register the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  }

  // --- Get navigation elements ---
  const navInicio = document.getElementById('nav-inicio');
  const navInfo = document.getElementById('nav-info');
  const homeView = document.getElementById('home-view');
  const infoView = document.getElementById('info-view');

  // --- "Inicio" tab click listener ---
  navInicio.addEventListener('click', () => {
    navInicio.classList.add('active');
    navInfo.classList.remove('active');
    homeView.style.display = 'block';
    infoView.style.display = 'none';
  });

  // --- "Información" tab click listener ---
  navInfo.addEventListener('click', () => {
    navInfo.classList.add('active');
    navInicio.classList.remove('active');
    infoView.style.display = 'block';
    homeView.style.display = 'none';
  });

  // --- "Información" Tab Accordion ---
  const infoBlocks = document.querySelectorAll('.info-block-clickable');
  
  infoBlocks.forEach(block => {
    block.addEventListener('click', () => {
      block.classList.toggle('active');
    });
  });

  // --- Click listener for the status card ---
  const statusCard = document.getElementById('status-card');
  statusCard.addEventListener('click', () => {
    document.getElementById('status-card').style.display = 'none';
    document.getElementById('locations-container').style.display = 'none';
    document.getElementById('details-container').style.display = 'block';
    console.log('Status card tapped, vibration enabled.');
  });

  // --- Audio Preload Hack (Run on load) ---
  alertSound.play().catch(() => {}); // Catch error if browser blocks it
  alertSound.pause();
  alertSound.currentTime = 0;
  
  // --- Listener for the "Back" button ---
  const backButton = document.getElementById('back-btn');
  backButton.addEventListener('click', () => {
    document.getElementById('details-container').style.display = 'none';
    document.getElementById('status-card').style.display = 'block';
    
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
  
  const detailSiren = document.getElementById('detail-siren-img');
  const detailAlertName = document.getElementById('detail-alert-name');
  const detailActionButton = document.getElementById('detail-action-button');

  const protocolText = document.getElementById('protocol');
  const stormRadiusText = document.getElementById('storm-radius');
  const detailsText = document.getElementById('details');

  // 1. Update Status Text
  statusDiv.innerText = status.replace('_', ' ');
  updatedDiv.innerText = "Última actualización: " + lastUpdated;
  
  // 2. Update Status Card Color
  statusCard.className = "mini-container status-card"; // Reset classes
  
  // Reset detail view elements
  detailSiren.style.display = 'block';
  detailAlertName.className = 'detail-h2';
  detailActionButton.className = 'action-button';
  detailsText.innerHTML = ""; 

  if (status == 'ROJA') {
    statusCard.classList.add('status-roja');
    detailAlertName.innerText = "Alerta Roja";
    detailActionButton.innerText = redProtocol;
    detailActionButton.classList.add('red');
    detailSiren.src = 'images/Red siren.png';
    protocolText.innerHTML = redItem1;
    stormRadiusText.innerHTML = redItem2; 

    // Sound and Vibration Logic
    if (status !== previousStatus){     
      if ('vibrate' in navigator){  
       navigator.vibrate([500, 200, 500, 200, 500]);
      }
      alertSound.play().catch(e => console.log("Sound play failed", e));
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
    detailAlertName.innerText = "Modo Prueba";
    detailActionButton.innerText = probandoProtocol;
    detailActionButton.classList.add('testing');
    detailSiren.src = 'images/Blue siren.png';
    protocolText.innerHTML = probandoItem1; 
    stormRadiusText.innerHTML = probandoItem2;
  } 
  else {
    statusCard.classList.add('status-error');
    statusDiv.innerText = 'Error al Cargar';
    detailAlertName.innerText = 'Error';
    detailActionButton.innerText = 'Sin Información';
    detailActionButton.classList.add('status-error');
    detailSiren.style.display = 'none';
    protocolText.innerHTML = "No se pudo cargar la información de la alerta.";
    stormRadiusText.innerHTML = "";
  }

  // 3. Update Locations logic
  const locationsContainer = document.getElementById('locations-container');
  const locationsList = document.getElementById('locations-list');
  const detailsContainer = document.getElementById('details-container');
  const infoView = document.getElementById('info-view'); 
  
  locationsList.innerHTML = ''; 
  
  if (locations.length > 0) {
    locations.forEach((loc) => {
      const li = document.createElement('li');
      li.textContent = loc;
      locationsList.appendChild(li);
    });

    if (detailsContainer.style.display === 'none' && infoView.style.display === 'none') {
      locationsContainer.style.display = 'block';
    } else {
      locationsContainer.style.display = 'none';
    }
  } else {
    locationsContainer.style.display = 'none';
  }

  previousStatus = status; 
  
  // 4. Auto-refresh
  setTimeout(loadStatus, 10000); 
}