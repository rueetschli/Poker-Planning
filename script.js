const apiUrl = 'backend/api.php';
let roomName = new URLSearchParams(window.location.search).get('room');
let userName = null;
let oldUserName = null; 
let estimationType = null;
let revealed = false;
let pollingInterval = null;
let timerInterval = null;
let timerEnd = null; 
let chart = null; // Für das Diagramm

document.addEventListener('DOMContentLoaded', () => {
    if (roomName) {
        const storedName = getStoredName();
        if (storedName && storedName.trim() !== '') {
            userName = storedName.trim();
            oldUserName = userName;
            joinRoom(userName);
        } else {
            const joinContainer = document.getElementById('user-join');
            if (joinContainer) joinContainer.style.display = 'block';
        }
    }
});

// Raum erstellen
document.getElementById('create-room')?.addEventListener('click', function (event) {
    event.preventDefault();
    const roomInput = document.getElementById('room-name');
    const typeSelect = document.getElementById('estimation-type');

    roomName = roomInput.value.trim();
    estimationType = typeSelect.value;

    if (!roomName) {
        alert('Bitte gib einen Raumnamen ein.');
        return;
    }

    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, estimationType })
    }).then(() => {
        const roomURL = `${window.location.origin}/?room=${encodeURIComponent(roomName)}`;
        window.location.href = roomURL;
    });
});

// Raum betreten (Name setzen)
document.getElementById('join-room')?.addEventListener('click', function (event) {
    event.preventDefault();
    const nameInput = document.getElementById('user-name');
    userName = nameInput.value.trim();
    if (!userName) {
        alert('Bitte gib deinen Namen ein.');
        return;
    }
    oldUserName = userName;
    storeName(userName);
    joinRoom(userName);
});

function joinRoom(name) {
    updateParticipant(name, null).then(() => {
        const joinContainer = document.getElementById('user-join');
        if (joinContainer) joinContainer.style.display = 'none';

        const renameSection = document.getElementById('rename-section');
        if (renameSection) renameSection.style.display = 'block';

        const timerContainer = document.getElementById('timer-container');
        if (timerContainer) timerContainer.style.display = 'block';
    });
}

// Namen ändern
document.getElementById('change-name')?.addEventListener('click', () => {
    const newName = prompt('Neuen Namen eingeben:', userName);
    if (newName && newName.trim() !== '' && newName.trim() !== userName) {
        renameUser(oldUserName, newName.trim());
    }
});

function renameUser(oldName, newName) {
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            room: roomName, 
            renameUser: true,
            oldUser: oldName, 
            newUser: newName 
        })
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            userName = newName;
            oldUserName = newName;
            storeName(newName);
            pollRoomData();
        } else {
            alert('Fehler beim Umbenennen: ' + (data.error || 'Unbekannter Fehler'));
        }
    });
}

// Karten auswählen
document.getElementById('cards-container')?.addEventListener('click', function (event) {
    if (event.target.classList.contains('card')) {
        if (!userName) {
            alert('Bitte tritt dem Raum bei, bevor du eine Karte auswählst.');
            return;
        }

        const card = event.target.textContent.trim();
        updateParticipant(userName, card).then(() => {
            document.querySelectorAll('.card').forEach((c) => c.classList.remove('selected'));
            event.target.classList.add('selected');
        });
    }
});

// Karten aufdecken
document.getElementById('reveal-cards')?.addEventListener('click', function () {
    revealed = true;
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, revealed: true })
    }).then(() => {
        pollRoomData();
    });
});

// Neues Spiel starten (neue Runde)
document.getElementById('new-game')?.addEventListener('click', function () {
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, newGame: true })
    }).then(() => {
        pollRoomData();
    });
});

// Neue User-Story starten
document.getElementById('new-story')?.addEventListener('click', function () {
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, newStory: true })
    }).then(() => {
        pollRoomData();
    });
});

// Teilnehmer hinzufügen oder Karte aktualisieren
function updateParticipant(user, card) {
    return fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, user: user, card: card })
    });
}

// Teilnehmerliste aktualisieren
function updateParticipants(participants) {
    const list = document.getElementById('participants-list');
    list.innerHTML = '';

    for (const [user, card] of Object.entries(participants)) {
        const listItem = document.createElement('li');
        const avatar = document.createElement('span');
        avatar.className = 'avatar';
        avatar.textContent = user.charAt(0).toUpperCase();

        const nameSpan = document.createElement('span');
        nameSpan.className = 'participant-name';
        nameSpan.textContent = user;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'participant-status';
        statusSpan.textContent = (card ? '✔' : '…');

        listItem.appendChild(avatar);
        listItem.appendChild(nameSpan);
        listItem.appendChild(statusSpan);
        list.appendChild(listItem);
    }
}

// Karten aktualisieren
function updateCards(type, revealedStatus) {
    if (revealedStatus) return;
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    const cardSets = {
        fibonacci: [1, 2, 3, 5, 8, 13, 21],
        'tshirt': ['XS', 'S', 'M', 'L', 'XL'],
        'tshirt-coffee': ['XS', 'S', 'M', 'L', 'XL', '☕'],
        'playing-cards': [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']
    };

    const cards = cardSets[type] || cardSets['fibonacci'];
    cards.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card;
        container.appendChild(cardElement);
    });
}

// Karten aufdecken
function revealCards(participants) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    for (const [user, card] of Object.entries(participants)) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card visible';
        cardElement.textContent = `${user}: ${card || 'Keine Wahl'}`;
        container.appendChild(cardElement);
    }

    displayStatistics(participants);
}

// Prüfen ob alle gleich sind
function allEqual(participants) {
    const vals = Object.values(participants).filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return false;
    return vals.every(val => val === vals[0]);
}

// Statistiken
function displayStatistics(participants) {
    const statsContainer = document.getElementById('statistics');
    if (!statsContainer) return;

    const values = extractNumericValues(participants);
    if (values.length > 0) {
        const avg = average(values);
        const med = median(values);

        document.getElementById('average-estimate').textContent = `Durchschnitt: ${avg}`;
        document.getElementById('median-estimate').textContent = `Median: ${med}`;
    } else {
        const frequencies = countFrequencies(participants);
        document.getElementById('average-estimate').textContent = 'Häufigkeiten: ' + JSON.stringify(frequencies);
        document.getElementById('median-estimate').textContent = '';
    }

    statsContainer.style.display = 'block';
}

// Historie aktualisieren
function updateHistory(historyData) {
    const historyContainer = document.getElementById('history');
    const chartContainer = document.getElementById('chart-container');
    if (!historyContainer || !chartContainer) return;

    const list = document.getElementById('history-list');
    list.innerHTML = '';

    if (!historyData || historyData.length === 0) {
        historyContainer.style.display = 'none';
        chartContainer.style.display = 'none';
        return;
    }

    historyContainer.style.display = 'block';

    // Daten fuer das Diagramm sammeln (nur numerische Schätzungen)
    const roundAverages = [];

    historyData.forEach((round, index) => {
        const li = document.createElement('li');
        li.textContent = `Runde ${index + 1} (${new Date(round.timestamp * 1000).toLocaleString()}): ${JSON.stringify(round.participants)}`;
        list.appendChild(li);

        const vals = extractNumericValues(round.participants);
        if (vals.length > 0) {
            roundAverages.push(averageNumber(vals));
        } else {
            roundAverages.push(null);
        }
    });

    // Diagramm aktualisieren
    updateChart(roundAverages);
}

// Diagramm aktualisieren
function updateChart(values) {
    const chartContainer = document.getElementById('chart-container');
    const ctx = document.getElementById('history-chart');
    if (!ctx) return;

    const validValues = values.map(v => typeof v === 'number' ? v : null);

    const dataPoints = validValues.map((val, i) => val !== null ? {x: i+1, y: val} : null).filter(Boolean);

    if (dataPoints.length === 0) {
        chartContainer.style.display = 'none';
        return;
    }

    chartContainer.style.display = 'block';

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Durchschnittliche Schaetzung pro Runde',
                data: dataPoints,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fill: true,
                parsing: {
                    xAxisKey: 'x',
                    yAxisKey: 'y'
                },
            }]
        },
        options: {
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Runde' } },
                y: { title: { display: true, text: 'Durchschnitt' } }
            }
        }
    });
}

// Raumdaten abrufen (Polling)
function pollRoomData() {
    fetch(`${apiUrl}?room=${encodeURIComponent(roomName)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                console.error('Fehler: ', data.error);
                return;
            }

            updateParticipants(data.participants);
            estimationType = data.estimationType;
            revealed = data.revealed || false;
            // Karten neu setzen
            if (!revealed) {
                updateCards(estimationType, revealed);
            } else {
                revealCards(data.participants);
            }

            if (data.history) {
                updateHistory(data.history);
            }

            // Buttons verwalten
            const newGameBtn = document.getElementById('new-game');
            const newStoryBtn = document.getElementById('new-story');
            const revealBtn = document.getElementById('reveal-cards');

            // Wenn aufgedeckt
            if (revealed) {
                revealBtn.style.display = 'none';
                // Prüfe, ob alle gleich sind
                if (allEqual(data.participants) && Object.keys(data.participants).length > 0) {
                    // Alle haben das gleiche -> nur neue User-Story
                    if (newGameBtn) newGameBtn.style.display = 'none';
                    if (newStoryBtn) newStoryBtn.style.display = 'inline-block';
                } else {
                    // Unterschiedliche Schaetzungen -> Neue Runde und Neue Story anbieten
                    if (newGameBtn) newGameBtn.style.display = 'inline-block';
                    if (newStoryBtn) newStoryBtn.style.display = 'inline-block';
                }
            } else {
                // Noch nicht aufgedeckt
                revealBtn.style.display = 'inline-block';
                if (newGameBtn) newGameBtn.style.display = 'none';
                if (newStoryBtn) newStoryBtn.style.display = 'none';
            }

            if (data.timerStart && data.timerEnd) {
                timerEnd = data.timerEnd;
                showTimer();
            } else {
                timerEnd = null;
                const timerDisplay = document.getElementById('timer-display');
                if (timerDisplay) timerDisplay.textContent = '';
            }

            if (!pollingInterval) {
                pollingInterval = setInterval(pollRoomData, 5000);
            }
        })
        .catch((err) => console.error('Fehler beim Abrufen der Raumdaten:', err));
}

if (roomName) {
    const roomLink = `${window.location.origin}/?room=${encodeURIComponent(roomName)}`;
    generateQRCode(roomLink);
    pollRoomData();
}

// QR-Code
function generateQRCode(text) {
    const qrContainer = document.getElementById('qr-code');
    if (qrContainer) {
        new QRCode(qrContainer, {
            text: text,
            width: 128,
            height: 128
        });
    }
}

// Link kopieren
document.getElementById('copy-link')?.addEventListener('click', function () {
    const roomLinkElem = document.getElementById('room-link');
    if (!roomLinkElem) return;
    const range = document.createRange();
    range.selectNode(roomLinkElem);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
        document.execCommand('copy');
        alert('Link kopiert!');
    } catch (err) {
        alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
    }
    window.getSelection().removeAllRanges();
});

// Timer starten
document.getElementById('start-timer')?.addEventListener('click', function () {
    const minutes = parseInt(document.getElementById('timer-minutes').value, 10);
    if (isNaN(minutes) || minutes <= 0) {
        alert('Bitte gib eine gültige Minutenanzahl an.');
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const duration = minutes * 60;
    const end = now + duration;

    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, timerStart: now, timerEnd: end })
    }).then(() => {
        timerEnd = end;
        showTimer();
    });
});

function showTimer() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = timerEnd - now;

        if (remaining <= 0) {
            clearInterval(timerInterval);
            display.textContent = 'Zeit abgelaufen!';
        } else {
            const min = Math.floor(remaining / 60);
            const sec = remaining % 60;
            display.textContent = `${min}:${sec < 10 ? '0' + sec : sec}`;
        }
    }, 1000);
}

// Hilfsfunktionen für Statistik
function extractNumericValues(participants) {
    const numericValues = [];
    for (const card of Object.values(participants)) {
        if (card && !isNaN(parseFloat(card))) {
            numericValues.push(parseFloat(card));
        } else if (card && isPlayingCardNumber(card)) {
            numericValues.push(convertCardToNumber(card));
        }
    }
    numericValues.sort((a, b) => a - b);
    return numericValues;
}

function isPlayingCardNumber(card) {
    const mapping = { 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return !isNaN(parseFloat(card)) || mapping[card] !== undefined;
}

function convertCardToNumber(card) {
    const mapping = { 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    if (!isNaN(parseFloat(card))) return parseFloat(card);
    return mapping[card] || null;
}

function average(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(2);
}

function averageNumber(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length);
}

function median(values) {
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    if (values.length % 2 !== 0) {
        return values[mid];
    } else {
        return ((values[mid - 1] + values[mid]) / 2).toFixed(2);
    }
}

function countFrequencies(participants) {
    const freq = {};
    for (const card of Object.values(participants)) {
        if (!card) continue;
        freq[card] = (freq[card] || 0) + 1;
    }
    return freq;
}

// Name speichern / auslesen
function storeName(name) {
    localStorage.setItem('poker_userName', name);
    document.cookie = "poker_userName=" + encodeURIComponent(name) + "; path=/;";
}

function getStoredName() {
    let name = localStorage.getItem('poker_userName');
    if (name) return name;
    const match = document.cookie.match(/(^| )poker_userName=([^;]+)/);
    if (match) return decodeURIComponent(match[2]);
    return null;
}
