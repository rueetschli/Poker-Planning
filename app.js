// app.js
const { useState, useEffect, useCallback, useRef } = React;

function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const roomParam = queryParams.get('room');
  const [room, setRoom] = useState(roomParam);

  const handleRoomCreated = (roomName) => {
    const newUrl = `${window.location.origin}/?room=${encodeURIComponent(roomName)}`;
    window.history.pushState(null, '', newUrl);
    setRoom(roomName);
  };

  return (
    <div className="App">
      <header>
        <h1>Poker Planning Tool</h1>
      </header>
      <main>
        {!room ? (
          <RoomCreation onRoomCreated={handleRoomCreated} />
        ) : (
          <Room roomName={room} />
        )}
      </main>
    </div>
  );
}

function RoomCreation({ onRoomCreated }) {
  const [roomName, setRoomName] = useState('');
  const [estimationType, setEstimationType] = useState('fibonacci');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      alert('Bitte gib einen Raumnamen ein.');
      return;
    }
    fetch('backend/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, estimationType })
    })
      .then(response => response.json())
      .then(() => {
        onRoomCreated(roomName);
      })
      .catch((error) => {
        console.error('Fehler beim Erstellen des Raumes:', error);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <label htmlFor="room-name">Raumname:</label>
      <input
        type="text"
        id="room-name"
        placeholder="z.B. Sprint-Planning"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        required
      />
      <label htmlFor="estimation-type">Schätz-Art:</label>
      <select
        id="estimation-type"
        value={estimationType}
        onChange={(e) => setEstimationType(e.target.value)}
        required
      >
        <option value="fibonacci">Fibonacci</option>
        <option value="tshirt">T-Shirt-Grössen</option>
      </select>
      <button type="submit">Raum erstellen</button>
    </form>
  );
}

function Room({ roomName }) {
  const [userName, setUserName] = useState(localStorage.getItem('poker_userName') || '');
  const [participants, setParticipants] = useState({});
  const [estimationType, setEstimationType] = useState('fibonacci');
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState([]);
  const [timerData, setTimerData] = useState({ timerStart: null, timerEnd: null });
  const [selectedCard, setSelectedCard] = useState(null);

  const roomLink = `${window.location.origin}/?room=${encodeURIComponent(roomName)}`;

  // Kürzeres Polling – alle 2 Sekunden
  const pollRoomData = useCallback(() => {
    fetch(`backend/api.php?room=${encodeURIComponent(roomName)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error('Fehler:', data.error);
          return;
        }
        setParticipants(data.participants || {});
        setEstimationType(data.estimationType || 'fibonacci');
        setRevealed(data.revealed || false);
        setHistory(data.history || []);
        if (data.timerStart && data.timerEnd) {
          setTimerData({ timerStart: data.timerStart, timerEnd: data.timerEnd });
        } else {
          setTimerData({ timerStart: null, timerEnd: null });
        }
      })
      .catch((err) => console.error('Fehler beim Abrufen der Raumdaten:', err));
  }, [roomName]);

  useEffect(() => {
    pollRoomData();
    const interval = setInterval(pollRoomData, 2000);
    return () => clearInterval(interval);
  }, [pollRoomData]);

  // Eigener Name wird entweder aus localStorage geladen oder per Prompt abgefragt
  useEffect(() => {
    if (!userName) {
      const name = prompt('Bitte gib deinen Namen ein:');
      if (name && name.trim() !== '') {
        setUserName(name.trim());
        localStorage.setItem('poker_userName', name.trim());
        updateParticipant(name.trim(), null);
      } else {
        alert('Name darf nicht leer sein.');
      }
    } else {
      updateParticipant(userName, null);
    }
  }, [userName]);

  const updateParticipant = (user, card) => {
    fetch('backend/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, user: user, card: card })
    })
      .then(() => pollRoomData())
      .catch((error) => console.error('Fehler beim Aktualisieren des Teilnehmers:', error));
  };

  const handleCardSelect = (card) => {
    if (!userName) {
      alert('Bitte tritt dem Raum bei, bevor du eine Karte auswählst.');
      return;
    }
    setSelectedCard(card);
    updateParticipant(userName, card);
  };

  const handleRevealCards = () => {
    fetch('backend/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, revealed: true })
    })
      .then(() => pollRoomData())
      .catch((error) => console.error('Fehler beim Aufdecken der Karten:', error));
  };

  const handleNewGame = () => {
    fetch('backend/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, newGame: true })
    })
      .then(() => {
        setSelectedCard(null);
        pollRoomData();
      })
      .catch((error) => console.error('Fehler beim Starten einer neuen Runde:', error));
  };

  const handleNewStory = () => {
    fetch('backend/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, newStory: true })
    })
      .then(() => {
        setSelectedCard(null);
        pollRoomData();
      })
      .catch((error) => console.error('Fehler beim Starten einer neuen User-Story:', error));
  };

  const handleChangeName = () => {
    const newName = prompt('Neuen Namen eingeben:', userName);
    if (newName && newName.trim() !== '' && newName.trim() !== userName) {
      fetch('backend/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomName,
          renameUser: true,
          oldUser: userName,
          newUser: newName.trim()
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setUserName(newName.trim());
            localStorage.setItem('poker_userName', newName.trim());
            pollRoomData();
          } else {
            alert('Fehler beim Umbenennen: ' + (data.error || 'Unbekannter Fehler'));
          }
        })
        .catch((error) => console.error('Fehler beim Umbenennen:', error));
    }
  };

  return (
    <div className="room">
      <h2>Raum: <span>{roomName}</span></h2>
      <p>
        Raum-Link:{' '}
        <span
          className="link"
          onClick={() => {
            navigator.clipboard.writeText(roomLink)
              .then(() => alert('Link kopiert!'))
              .catch(() => alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.'));
          }}
        >
          {roomLink}
        </span>
      </p>
      <QRCodeComponent value={roomLink} />
      <div className="user-info">
        <span>Du: {userName}</span>
        <button onClick={handleChangeName} title="Namen ändern">📝</button>
      </div>
      <ParticipantsList participants={participants} />
      <Timer roomName={roomName} timerData={timerData} />
      {!revealed ? (
        <Cards
          estimationType={estimationType}
          selectedCard={selectedCard}
          onCardSelect={handleCardSelect}
        />
      ) : (
        <div className="cards">
          {Object.entries(participants).map(([user, card]) => (
            <div key={user} className="card visible">
              {user}: {card || 'Keine Wahl'}
            </div>
          ))}
        </div>
      )}
      <div className="action-buttons">
        {!revealed && <button onClick={handleRevealCards}>Karten aufdecken</button>}
        {revealed && (
          <>
            <button onClick={handleNewGame}>Neue Runde starten</button>
            <button onClick={handleNewStory}>Neue User-Story</button>
          </>
        )}
      </div>
      <History history={history} />
      <ChartComponent history={history} />
    </div>
  );
}

function ParticipantsList({ participants }) {
  return (
    <div className="participants-container">
      <h3>Teilnehmer:</h3>
      <ul className="participants-list">
        {Object.entries(participants).map(([user, card]) => (
          <li key={user}>
            <span className="avatar">{user.charAt(0).toUpperCase()}</span>
            <span className="participant-name">{user}</span>
            {card ? (
              <span className="participant-status tip-given">✔</span>
            ) : (
              <span className="participant-status tip-missing">✖</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Angepasste Karten-Komponente
   – Bei 'tshirt' wird vor den normalen Größen ein T-Shirt-Icon (👕) eingeblendet */
function Cards({ estimationType, selectedCard, onCardSelect }) {
  const cardSets = {
    fibonacci: [0, 1, 2, 3, 5, 8, 13, 20, 40, 100, "Zu gross", "Zu unklar", "Have a Break"],
    tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', "Zu gross", "Zu unklar", "Have a Break"]
  };
  const cards = cardSets[estimationType] || cardSets['fibonacci'];

  const renderCardContent = (card) => {
    if (card === "Zu gross") return "🔺";
    if (card === "Zu unklar") return "❓";
    if (card === "Have a Break") return "☕";
    if (estimationType === 'tshirt') return "👕 " + card;
    return card;
  };

  return (
    <div className="cards">
      {cards.map(card => (
        <div
          key={card}
          className={`card ${selectedCard === card ? 'selected' : ''}`}
          onClick={() => onCardSelect(card)}
        >
          {renderCardContent(card)}
        </div>
      ))}
    </div>
  );
}

function Timer({ roomName, timerData }) {
  const [minutes, setMinutes] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');
  const timerIntervalRef = useRef(null);

  const startTimer = () => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) {
      alert('Bitte gib eine gültige Minutenanzahl an.');
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const duration = mins * 60;
    const end = now + duration;
    fetch('backend/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, timerStart: now, timerEnd: end })
    })
    .then(() => {
      // Timer wird über das Polling in Room aktualisiert
    })
    .catch((error) => console.error('Fehler beim Starten des Timers:', error));
  };

  useEffect(() => {
    if (timerData.timerEnd) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = timerData.timerEnd - now;
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          setTimeDisplay('Zeit abgelaufen!');
        } else {
          const min = Math.floor(remaining / 60);
          const sec = remaining % 60;
          setTimeDisplay(`${min}:${sec < 10 ? '0' + sec : sec}`);
        }
      }, 1000);
      return () => clearInterval(timerIntervalRef.current);
    } else {
      setTimeDisplay('');
    }
  }, [timerData]);

  return (
    <div className="timer-container">
      <h3>Timer:</h3>
      <div className="timer-controls">
        <input
          type="number"
          placeholder="Minuten"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <button onClick={startTimer}>Timer starten</button>
      </div>
      <div className="timer-display">{timeDisplay}</div>
    </div>
  );
}

/* Überarbeitete History-Komponente
   Zeigt jede vergangene Runde übersichtlich mit Rundennummer, Datum und Teilnehmerliste */
function History({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="history">
        <h3>Vergangene Runden (aktuelle User-Story)</h3>
        <p>Keine vergangene Runde vorhanden.</p>
      </div>
    );
  }
  return (
    <div className="history">
      <h3>Vergangene Runden (aktuelle User-Story)</h3>
      {history.map((round, index) => (
        <div key={index} className="round-history">
          <h4>Runde {index + 1} – {new Date(round.timestamp * 1000).toLocaleString()}</h4>
          <ul>
            {Object.entries(round.participants).map(([user, card]) => (
              <li key={user}>{user}: {card || 'Keine Wahl'}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* Überarbeitete Chart-Komponente
   Falls keine numerischen Daten vorhanden sind, wird ein Hinweistext angezeigt */
function ChartComponent({ history }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const isNumeric = (value) => !isNaN(parseFloat(value));
  const convertCardToNumber = (card) => {
    const mapping = { 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    if (isNumeric(card)) return parseFloat(card);
    return mapping[card] || null;
  };
  const extractNumericValues = (participants) => {
    const values = [];
    Object.values(participants).forEach(card => {
      if (card === "Zu gross" || card === "Zu unklar" || card === "Have a Break") return;
      if (card) {
        const num = convertCardToNumber(card);
        if (num !== null) {
          values.push(num);
        }
      }
    });
    values.sort((a, b) => a - b);
    return values;
  };
  const average = (values) => {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  };

  useEffect(() => {
    const roundAverages = history.map(round => {
      const nums = extractNumericValues(round.participants);
      return nums.length > 0 ? average(nums) : null;
    });
    const validData = roundAverages.map((val, index) => ({
      x: index + 1,
      y: val
    })).filter(point => point.y !== null);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    if (validData.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Durchschnittliche Schätzung pro Runde',
            data: validData,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76,175,80,0.2)',
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: { display: true, text: 'Runde' }
            },
            y: {
              title: { display: true, text: 'Durchschnitt' }
            }
          }
        }
      });
    }
  }, [history]);

  return (
    <div className="chart-container">
      <h3>Verlauf</h3>
      {(!history ||
        history.length === 0 ||
        history.every(round => extractNumericValues(round.participants).length === 0)) ? (
        <p>Keine numerischen Daten zur Auswertung vorhanden.</p>
      ) : (
        <canvas ref={chartRef}></canvas>
      )}
    </div>
  );
}

function QRCodeComponent({ value }) {
  const qrRef = useRef(null);
  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      new QRCode(qrRef.current, {
        text: value,
        width: 128,
        height: 128
      });
    }
  }, [value]);
  return <div className="qr-code" ref={qrRef}></div>;
}

// App rendern
const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(<App />);
