var HexCoord = hc = require("./HexCoord");
var EventEmitter = require("events").EventEmitter;

var otherPlayer = [1, 0];
var colors = ["blue", "red"];

function applyMove(player, move) {
    if (this.turn !== this.players[player]) return;
    if (typeof(move) === "string") {
        if (this.bases[player] === move && !this.board[move] && this.reserves[player] > 0) {
            this.board[move] = {color: colors[player], size: 1};
            this.reserves[player] --;
            this.turn = this.players[otherPlayer[player]];
            this.numMoves ++;
        }
    } else if (typeof(move) === "object") {
        var from = this.board[move.from];
        var to = this.board[move.to];
        var fromHex = hc.fromString(move.from);
        var toHex = hc.fromString(move.to);
        if (!from || !fromHex || !toHex ||
            from.color !== colors[player] ||
            fromHex.distanceTo() > 3 ||
            toHex.distanceTo() > 3 ||
            fromHex.distanceTo(toHex) !== from.size) return;
        if (to && to.color === colors[player]) {
            if (to.size === 1) {
                this.reserves[player] ++;
            }
            if (from.size === 1) {
                this.reserves[player] ++;
            }
            to.size += from.size;
        } else {
            if (to && to.size === 1) {
                this.reserves[otherPlayer[player]] ++;
            }
            this.board[move.to] = from;
        }
        this.board[move.from] = null;
        this.turn = this.players[otherPlayer[player]];
        this.numMoves ++;
    }
    this.p1.socket.emit("board", this.packState());
    this.p2.socket.emit("board", this.packState());
    this.updateWinConditions(otherPlayer[player]);
};

var Game = module.exports = function(player1, player2) {
    this.lastTickTime = 0;
    this.numMoves = 0;
    this.timers = [300, 300];
    this.emitter = new EventEmitter();
    this.p1 = player1;
    this.p2 = player2;
    this.players = [this.p1, this.p2];
    this.checks = [false, false];
    this.reserves = [2, 2];
    player1.game = this;
    player2.game = this;
    player1.socket.on("move", applyMove.bind(this, 0));
    player2.socket.on("move", applyMove.bind(this, 1));
    this.turn = this.p1;
    var board = this.board = board = {};
    var seed = new hc();
    var tiles = [seed].concat(seed.nAway(1)).concat(seed.nAway(2)).concat(seed.nAway(3));
    for (var i = 0; i < tiles.length; i ++) {
        var repr = tiles[i].toString();
        board[repr] = null;
    }
    this.bases = ["0,-3,3", "0,3,-3"];
};

Game.prototype.packState = function() {
    var players = {};
    players[this.p1.username] = "blue";
    players[this.p2.username] = "red";
    return {
        playersTurn: this.turn.username,
        players: players,
        grid: this.board,
        timers: {
            "blue": this.timers[0],
            "red": this.timers[1]
        },
        moves: this.numMoves
    }
};

Game.prototype.start = function() {
    this.p1.socket.emit("board", this.packState());
    this.p2.socket.emit("board", this.packState());
    this.lastTickTime = Date.now();
    var that = this;
    this.timer = setInterval(function() {
        var tickTime = Date.now();
        var dt = (tickTime - that.lastTickTime) / 1000;
        that.lastTickTime = tickTime;
        if (that.numMoves > 1) {
            var tIdx = that.players.indexOf(that.turn);
            that.timers[tIdx] -= dt;
            if (that.timers[tIdx] <= 0) {
                that.timers[tIdx] = 0;
                that.p1.socket.emit("board", that.packState());
                that.p2.socket.emit("board", that.packState());
                that.end(that.turn);
            }
        }
    }, 100);
};

Game.prototype.name = function() {
    return this.p1.username + "-" + this.p2.username;
};

Game.prototype.end = function(losingPlayer) {
    clearInterval(this.timer);
    this.p1.location = "lobby";
    this.p2.location = "lobby";
    this.p1.socket.removeAllListeners("move");
    this.p2.socket.removeAllListeners("move");
    if (losingPlayer) {
        if (losingPlayer === this.p1) {
            this.p1.socket.emit("gameLost");
            this.p2.socket.emit("gameWon");
        } else if (losingPlayer === this.p2) {
            this.p2.socket.emit("gameLost");
            this.p1.socket.emit("gameWon");
        } else {
            this.p1.socket.emit("gameDraw");
            this.p2.socket.emit("gameDraw");
        }
    } else {
        this.p1.socket.emit("gameDraw");
        this.p2.socket.emit("gameDraw");
    }
    this.emitter.emit("ended");
};

Game.prototype.updateWinConditions = function(pNum) {
    var myBase = this.bases[pNum];
    var theirBase = this.bases[otherPlayer[pNum]];
    if (this.board[myBase] && this.board[myBase].color !== colors[pNum]) {
        if (this.checks[pNum]) {
            if (this.board[theirBase] && this.board[theirBase].color !== colors[otherPlayer[pNum]]) {
                return this.end();
            } else {
                return this.end(this.players[pNum]);
            }
        }
        this.checks[pNum] = true;
    } else {
        this.checks[pNum] = false;
    }
    if (this.checks[pNum]) {
        for (var cell in this.board) {
            if (this.board[cell] && this.board[cell].color === colors[pNum]) return;
        }
        this.end(this.players[pNum]);
    }
};

Game.prototype.baseOccupied = function(pNum) {
    
};