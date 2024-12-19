<?php
$roomName = isset($_GET['room']) ? htmlspecialchars($_GET['room']) : null;
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Poker Planning</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <!-- Chart.js für das Diagramm -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <header>
        <h1>Poker Planning Tool</h1>
    </header>

    <main>
        <?php if (!$roomName): ?>
        <!-- Raum erstellen -->
        <div id="room-creation" class="form-container">
            <label for="room-name">Raumname:</label>
            <input type="text" id="room-name" name="room-name" placeholder="z.B. Sprint-Planning" required>

            <label for="estimation-type">Schaetz-Art:</label>
            <select id="estimation-type" name="estimation-type" required>
                <option value="fibonacci">Fibonacci</option>
                <option value="tshirt">T-Shirt-Groessen</option>
                <option value="tshirt-coffee">T-Shirt (mit Kaffee)</option>
                <option value="playing-cards">Standard-Spielkarten</option>
            </select>

            <button id="create-room">Raum erstellen</button>
        </div>
        <?php else: ?>
        <!-- Raum -->
        <div id="room" class="room">
            <h2>Raum: <span id="room-name-display"><?php echo $roomName; ?></span></h2>
            <p>
                Raum-Link: 
                <span id="room-link"><?php echo "https://{$_SERVER['HTTP_HOST']}/?room=" . urlencode($roomName); ?></span> 
                <button id="copy-link">Kopieren</button>
            </p>
            <div id="qr-code" class="qr-code"></div>

            <!-- Nutzername-Eingabe -->
            <div id="user-join" style="display:none;">
                <label for="user-name">Dein Name:</label>
                <input type="text" id="user-name" placeholder="Gib deinen Namen ein">
                <button id="join-room">Raum betreten</button>
            </div>

            <!-- Button zum Namen ändern -->
            <div id="rename-section" style="display:none;">
                <button id="change-name">Namen ändern</button>
            </div>

            <div id="participants-container">
                <h3>Teilnehmer:</h3>
                <ul id="participants-list"></ul>
            </div>

            <!-- Timer-Optionen -->
            <div id="timer-container" style="display:none;">
                <h3>Timer:</h3>
                <div id="timer-controls">
                    <input type="number" id="timer-minutes" placeholder="Minuten">
                    <button id="start-timer">Timer starten</button>
                </div>
                <div id="timer-display"></div>
            </div>

            <div id="cards-container" class="cards"></div>

            <div id="action-buttons">
                <button id="reveal-cards">Karten aufdecken</button>
                <button id="new-game" style="display:none;">Neue Runde starten</button>
                <button id="new-story" style="display:none;">Neue User-Story</button>
            </div>

            <!-- Statistiken nach dem Aufdecken -->
            <div id="statistics" style="display:none;">
                <h3>Auswertung</h3>
                <p id="average-estimate"></p>
                <p id="median-estimate"></p>
            </div>

            <!-- Historie vergangener Runden -->
            <div id="history" style="display:none;">
                <h3>Vergangene Runden (aktuelle User-Story)</h3>
                <ul id="history-list"></ul>
            </div>

            <!-- Diagramm -->
            <div id="chart-container" style="display:none;">
                <h3>Verlauf</h3>
                <canvas id="history-chart"></canvas>
            </div>

        </div>
        <?php endif; ?>
    </main>

    <script src="script.js"></script>
</body>
</html>
