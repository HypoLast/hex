var http = require("http");
var express = require("express");
var socketIo = require("socket.io");
var path = require("path");

var Player = require("./Player");
var Game = require("./Game");

var app = express();
app.use(express.static(path.join(__dirname, "public")));

var server = http.createServer(app);
var io = socketIo(server);

var players = {};
var games = {};

function validateUsername(username) {
    if (username.length < 3 || username.length > 16) return false;
    var match = username.match(/[_0-9a-zA-Z]+/);
    return match != null && username == match[0];
};

io.on("connect", function(socket) {
    
    var myself = undefined;

    function username(name) {
        if (!validateUsername(name)) {
            socket.emit("invalidName");
            return;
        }
        if (players[name] === undefined) {
            socket.removeListener("username", username);
            myself = players[name] = new Player(name, socket);
            socket.emit("nameConfirmed");
            io.emit("playerJoinedLobby", {name: name, available: true});
            for (var pName in players) {
                if (pName !== name) {
                    socket.emit("playerJoinedLobby", {name: pName, available: players[pName].location === "lobby"});
                }
            }
        } else {
            socket.emit("nameInUse");
        }
    };

    function challenge(name) {
        if (!myself || myself.location !== "lobby") return;
        var player = players[name];
        if (!player) {
            socket.emit("challengeDeclined", "That player isn't logged on.");
        } else if (player.location !== "lobby") {
            socket.emit("challengeDeclined", "The player is not available.");
        } else {
            myself.location = "challenging";
            player.location = "challenged";
            player.socket.emit("challenged", myself.username);
            myself.engagedPlayer = player;
            player.engagedPlayer = myself;
        }
    };

    function cancelChallenge() {
        if (!myself || myself.location !== "challenging") return;
        var player = myself.engagedPlayer;
        if (!player) return;
        player.socket.emit("challengeCancelled");
        player.engagedPlayer = undefined;
        myself.engagedPlayer = undefined;
        player.location = "lobby";
        myself.location = "lobby";
    };

    function declineChallenge() {
        if (!myself || myself.location !== "challenged") return;
        var player = myself.engagedPlayer;
        if (!player) {
            socket.emit("challengeCancelled");
            return;
        }
        player.socket.emit("challengeDeclined", myself.username + " refused your challenge.");
        player.engagedPlayer = undefined;
        myself.engagedPlayer = undefined;
        player.location = "lobby";
        myself.location = "lobby";
    };

    function acceptChallenge() {
        if (!myself || myself.location !== "challenged") return;
        var player = myself.engagedPlayer;
        if (!player || !player.location === "challenging") {
            socket.emit("challengeCancelled");
            return;
        }
        player.location = "inGame";
        myself.location = "inGame";
        player.socket.emit("startGame");
        myself.socket.emit("startGame");
        var player1, player2;
        if (Math.random() < 0.5) {
            player1 = myself;
            player2 = player;
        } else {
            player1 = player;
            player2 = myself;
        }
        var game = new Game(player1, player2);
        games[game.name()] = game;
        game.start();
        game.emitter.on("ended", function() {
            delete games[game.name()];
        });
    };

    socket.on("username", username);
    socket.on("challenge", challenge);
    socket.on("cancelChallenge", cancelChallenge);
    socket.on("acceptChallenge", acceptChallenge);
    socket.on("declineChallenge", declineChallenge);

    socket.on("disconnect", function() {
        if (myself) {
            if (myself.engagedPlayer) {
                if (myself.location === "challenged") {
                    myself.engagedPlayer.socket.emit("challengeDeclined", "That player isn't logged on.");
                } else if (myself.location === "challenging") {
                    myself.engagedPlayer.socket.emit("challengeCancelled")
                } else if (myself.game) {
                    myself.game.end(myself);
                }
            }
            delete players[myself.username];
            io.emit("playerLeftLobby", myself.username);
        }
    });

});

server.listen(80, function() {
    console.log("server started on port 80");
});