;(function() {
    'use strict';
    var Game = window.Game = window.Game || {};

    Game.SocketIO = {
        init: function() {
            this.socket = io();
            this.emitter = new EventEmitter();
            this.username = undefined;
        },
        joinLobby: function(name) {
            var that = this;
            that.socket.emit("username", name);
            that.socket.on("nameConfirmed", function() {
                that.username = name;
                that.socket.removeAllListeners();
                that.emitter.emit("joinLobby");
                that.socket.on("playerJoinedLobby", that.playerJoinedLobby);
                that.socket.on("playerLeftLobby", that.playerLeftLobby);
                that.socket.on("playerUnavailable", that.playerUnavailable);
                that.socket.on("playerAvailable", that.playerAvailable);
                that.socket.on("challenged", that.challenged);
                that.socket.on("challengeCancelled", that.challengeCancelled);
                that.socket.on("challengeDeclined", that.challengeDeclined);
                that.socket.on("startGame", that.startGame);
                that.socket.on("board", that.board);
                that.socket.on("gameLost", that.gameLost);
                that.socket.on("gameWon", that.gameWon);
                that.socket.on("gameDraw", that.gameDraw);
            });
            that.socket.on("nameInUse", function() {
                that.emitter.emit("nameInUse");
                that.socket.removeAllListeners();
            });
            that.socket.on("invalidName", function() {
                that.emitter.emit("invalidName");
                that.socket.removeAllListeners();
            });
        },
        playerJoinedLobby: function(joinData) {
            Game.SocketIO.emitter.emit("playerJoinedLobby", joinData);
        },
        playerLeftLobby: function(name) {
            Game.SocketIO.emitter.emit("playerLeftLobby", name);
        },
        playerUnavailable: function(name) {
            Game.SocketIO.emitter.emit("playerUnavailable", name);
        },
        playerAvailable: function(name) {
            Game.SocketIO.emitter.emit("playerAvailable", name);
        },
        challenge: function(name) {
            this.socket.emit("challenge", name);
        },
        cancelChallenge: function() {
            this.socket.emit("cancelChallenge");
        },
        declineChallenge: function() {
            this.socket.emit("declineChallenge");
        },
        acceptChallenge: function() {
            this.socket.emit("acceptChallenge");
        },
        challenged: function(name) {
            Game.SocketIO.emitter.emit("challenged", name);
        },
        challengeCancelled: function() {
            Game.SocketIO.emitter.emit("challengeCancelled");
        },
        challengeDeclined: function(reason) {
            Game.SocketIO.emitter.emit("challengeDeclined", reason);
        },
        startGame: function() {
            Game.SocketIO.emitter.emit("startGame");
        },
        board: function(board) {
            Game.SocketIO.emitter.emit("board", board);
        },
        gameWon: function() {
            Game.SocketIO.emitter.emit("gameWon");
        },
        gameLost: function() {
            Game.SocketIO.emitter.emit("gameLost");
        },
        gameDraw: function() {
            Game.SocketIO.emitter.emit("gameDraw");
        },
        move: function(move) {
            this.socket.emit("move", move);
        }
    };

})();