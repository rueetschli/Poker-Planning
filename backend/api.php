<?php
header('Content-Type: application/json');

$dataFile = __DIR__ . '/rooms.json';

if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

$rooms = json_decode(file_get_contents($dataFile), true);
if (!is_array($rooms)) {
    $rooms = [];
}

$pokerSets = [
    'fibonacci' => [1, 2, 3, 5, 8, 13, 21],
    'tshirt' => ['XS', 'S', 'M', 'L', 'XL'],
    'tshirt-coffee' => ['XS', 'S', 'M', 'L', 'XL', '☕'],
    'playing-cards' => [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']
];

function saveRooms($dataFile, $rooms) {
    $fp = fopen($dataFile, 'c+');
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($rooms));
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $roomName = $_GET['room'] ?? null;
    if ($roomName) {
        if (isset($rooms[$roomName])) {
            echo json_encode($rooms[$roomName]);
        } else {
            $rooms[$roomName] = [
                'timestamp' => time(),
                'participants' => [],
                'estimationType' => 'fibonacci',
                'revealed' => false,
                'history' => []
            ];
            saveRooms($dataFile, $rooms);
            echo json_encode($rooms[$roomName]);
        }
    } else {
        echo json_encode(['error' => 'Raum nicht gefunden']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $roomName = $input['room'] ?? null;

    if (!$roomName) {
        echo json_encode(['error' => 'Ungueltige Eingabe: Raumname fehlt']);
        exit;
    }

    $userName = $input['user'] ?? null;
    $card = $input['card'] ?? null;
    $estimationType = $input['estimationType'] ?? null;
    $revealed = $input['revealed'] ?? null;
    $newGame = $input['newGame'] ?? null;
    $renameUser = $input['renameUser'] ?? null;
    $oldUser = $input['oldUser'] ?? null;
    $newUser = $input['newUser'] ?? null;
    $timerStart = $input['timerStart'] ?? null;
    $timerEnd = $input['timerEnd'] ?? null;
    $newStory = $input['newStory'] ?? null;

    if (!isset($rooms[$roomName])) {
        if (!$estimationType || !isset($pokerSets[$estimationType])) {
            $estimationType = 'fibonacci';
        }

        $rooms[$roomName] = [
            'timestamp' => time(),
            'participants' => [],
            'estimationType' => $estimationType,
            'revealed' => false,
            'history' => []
        ];
    }

    if ($renameUser && $oldUser && $newUser) {
        if (isset($rooms[$roomName]['participants'][$oldUser])) {
            $oldCard = $rooms[$roomName]['participants'][$oldUser];
            $rooms[$roomName]['participants'][$newUser] = $oldCard;
            unset($rooms[$roomName]['participants'][$oldUser]);
        } else {
            echo json_encode(['error' => 'Alter Benutzer nicht gefunden']);
            exit;
        }
        saveRooms($dataFile, $rooms);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($newStory) {
        $rooms[$roomName]['participants'] = [];
        $rooms[$roomName]['revealed'] = false;
        $rooms[$roomName]['history'] = [];
        unset($rooms[$roomName]['timerStart']);
        unset($rooms[$roomName]['timerEnd']);
    }

    if ($newGame) {
        if ($rooms[$roomName]['revealed'] === true) {
            $rooms[$roomName]['history'][] = [
                'timestamp' => time(),
                'participants' => $rooms[$roomName]['participants'],
                'estimationType' => $rooms[$roomName]['estimationType']
            ];
        }
        $rooms[$roomName]['participants'] = [];
        $rooms[$roomName]['revealed'] = false;
        unset($rooms[$roomName]['timerStart']);
        unset($rooms[$roomName]['timerEnd']);
    }

    if ($revealed !== null) {
        $rooms[$roomName]['revealed'] = $revealed;
    }

    if ($userName) {
        if (!isset($rooms[$roomName]['participants'][$userName])) {
            $rooms[$roomName]['participants'][$userName] = null;
        }
        if ($card !== null) {
            $rooms[$roomName]['participants'][$userName] = $card;
        }
    }

    if ($timerStart && $timerEnd) {
        $rooms[$roomName]['timerStart'] = $timerStart;
        $rooms[$roomName]['timerEnd'] = $timerEnd;
    }

    saveRooms($dataFile, $rooms);
    echo json_encode(['success' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $now = time();
    $rooms = array_filter($rooms, function ($room) use ($now) {
        return ($now - $room['timestamp']) < 48 * 3600;
    });
    saveRooms($dataFile, $rooms);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Ungueltige Anfrage']);
