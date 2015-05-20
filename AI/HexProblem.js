var TwoPlayerProblem = require("./TwoPlayerProblem");
var Edge = TwoPlayerProblem.Edge;
var HexCoord = require("../HexCoord");

var HexProblem = module.exports = function(state, playerName) {
    this.state = state;
    this.playerName = playerName;
    for (var pName in state.players) {
        if (pName !== playerName) {
            this.otherPlayerName = pName;
        }
    }
    if (state.players[playerName] === "blue") {
        this.playerNum = 0;
        this.players = [playerName, this.otherPlayerName];
    } else {
        this.playerNum = 1;
        this.players = [this.otherPlayerName, playerName];
    }
    this.playersTurnNum = this.players.indexOf(this.state.playersTurn);
    this.h = undefined;
    this.e = undefined;
    this.w = undefined;
    this.lm = undefined;
    this.str = undefined;
};

var blueBase = new HexCoord(0, -3, 3);
var redBase = new HexCoord(0, 3, -3);

function copyGrid(grid) {
    var newGrid = {};
    for (var cell in grid) {
        if (grid[cell]) {
            newGrid[cell] = { color: grid[cell].color, size: grid[cell].size };
        } else {
            newGrid[cell] = null; 
        }
    }
    return newGrid;
};

HexProblem.prototype.dispose = function() {
    this.state = undefined;
    this.h = undefined;
    this.e = undefined;
    this.w = undefined;
    this.lm = undefined;
    this.str = undefined;
};

HexProblem.prototype.canMove = function() {
    return this.state.playersTurn === this.playerName;
};

HexProblem.prototype.winner = function() {
    if (this.w !== undefined) return this.w;
    var state = this.state;
    var colorsTurn = state.players[state.playersTurn];
    if (colorsTurn === "blue" && state.checks[0] && state.grid[blueBase.toString()] && state.grid[blueBase.toString()].color === "red") {
        if (!state.grid[redBase.toString()] || state.grid[redBase.toString()].color === "red") {
            return this.w = "red";
        } else {
            return this.w = "draw";
        }
    } else if (colorsTurn === "red" && state.checks[1] && state.grid[redBase.toString()] && state.grid[redBase.toString()].color === "blue") {
        if (!state.grid[blueBase.toString()] || state.grid[blueBase.toString()].color === "blue") {
            return this.w = "blue";
        } else {
            return this.w = "draw";
        }
    }
    return this.w = null;
};

HexProblem.prototype.volatility = function() {
    var colorH = this.colorHeuristics();
    return colorH.blue + colorH.red;
};

HexProblem.prototype.colorHeuristics = function() {
    var bluePieces = 0;
    var redPieces = 0;
    var state = this.state;
    for (var cell in state.grid) {
        if (state.grid[cell]) {
            if (state.grid[cell].color === "blue") {
                var weight = state.grid[cell].size;
                var hex = HexCoord.fromString(cell);
                weight *= (hex.y - hex.z + 6) / 12 * 0.4 + 1; // farther up the board is better
                if (hex.distanceTo(redBase) === state.grid[cell].size) {
                    weight *= 1.5; // in jumping distance of the base, this is worth a lot
                }
                if (state.grid[cell].size === 1) {
                    weight -= 0.2; // make 2 1's slightly worse than a 2
                }
                bluePieces += weight;
            } else {
                var weight = state.grid[cell].size;
                var hex = HexCoord.fromString(cell);
                weight *= (hex.z - hex.y + 6) / 12 * 0.4 + 1;
                if (hex.distanceTo(blueBase) === state.grid[cell].size) {
                    weight *= 1.5;
                }
                if (state.grid[cell].size === 1) {
                    weight -= 0.2;
                }
                redPieces += weight;
            }
        }
    }
    return {blue: bluePieces, red: redPieces};
};

HexProblem.prototype.heuristic = function() {
    if (this.h !== undefined) return this.h;
    var state = this.state;
    var myColor = state.players[this.playerName];
    // check for a win first
    var colorsTurn = state.players[state.playersTurn];
    if (this.winner() === "red") {
        if (myColor === "blue") {
            return this.h = -Infinity;
        } else {
            return this.h = Infinity;
        }
    } else if (this.winner() === "blue") {
        if (myColor === "red") {
            return this.h = -Infinity;
        } else {
            return this.h = Infinity;
        }
    } else if (this.winner() === "draw") {
        return this.h = 0;
    }
    var colorH = this.colorHeuristics();
    if (myColor === "blue") {
        return this.h = colorH.blue - colorH.red;
    } else {
        return this.h = colorH.red - colorH.blue;
    }
};

HexProblem.prototype.edges = function() {
    if (this.e !== undefined) return this.e;
    var legalMoves = this.legalMoves();
    var edges = [];
    for (var i = legalMoves.length - 1; i >= 0; i--) {
        var move = legalMoves[i];
        edges.push(new Edge(this, move, new TwoPlayerProblem(new HexProblem(this.nextState(move), this.playerName))));
    };

    return this.e = edges;
};

HexProblem.prototype.legalMoves = function() {
    if (this.lm !== undefined) return this.lm;
    var legalMoves = [];
    if (this.winner()) {
        return this.lm = legalMoves;
    }
    var myColor = this.state.players[this.state.playersTurn];
    var reserve = 2;
    var grid = this.state.grid;
    for (var cell in grid) {
        if (grid[cell] && grid[cell].color === myColor) {
            if (grid[cell].size === 1) reserve --;
            var hex = HexCoord.fromString(cell);
            var provisional = hex.nAway(this.state.grid[cell].size);
            for (var i = 0; i < provisional.length; i ++) {
                if (provisional[i].distanceTo() <= 3) {
                    legalMoves.push(new Move(hex, provisional[i]));
                }
            }
        }
    }
    if (!grid["0,-3,3"] && myColor === "blue" && reserve > 0) {
        legalMoves.push(new Move(new HexCoord(0, -3, 3)));
    } else if (!grid["0,3,-3"] && myColor === "red" && reserve > 0) {
        legalMoves.push(new Move(new HexCoord(0, 3, -3)));
    }
    return this.lm = legalMoves;
};

HexProblem.prototype.toString = function() {
    if (this.str) return this.str;
    return this.str = JSON.stringify(this.state);
};

var otherPlayer = [1, 0];
var colors = ["blue", "red"];
var bases = ["0,-3,3", "0,3,-3"];

HexProblem.prototype.nextState = function(move) {
    var newState = {};
    newState.players = this.state.players;
    newState.playersTurn = this.players[otherPlayer[this.playersTurnNum]];
    newState.moves = this.state.moves ++;
    newState.grid = copyGrid(this.state.grid);
    newState.checks = [this.state.checks[0], this.state.checks[1]];
    if (!move.to) {
        newState.grid[bases[this.playersTurnNum]] = {size: 1, color: colors[this.playersTurnNum]};
    } else {
        var from = newState.grid[move.from.toString()];
        var to = newState.grid[move.to.toString()];
        newState.grid[move.from.toString()] = null;
        if (!to || to.color !== from.color) {
            newState.grid[move.to.toString()] = from;
        } else {
            to.size += from.size;
        }
        newState.grid[move.from.toString()] = null;
    }
    var myBase = bases[this.playersTurnNum];
    if (this.state.grid[myBase] && this.state.grid[myBase].color === colors[otherPlayer[this.playersTurnNum]]) {
        newState.checks[this.playersTurnNum] = true;
    } else {
        newState.checks[this.playersTurnNum] = false;
    }
    return newState;
};

var Move = HexProblem.Move = function(from, to) {
    this.from = from;
    this.to = to;
};

Move.prototype.toString = function() {
    if (!this.to) {
        return this.from.toString();
    } else {
        return this.from.toString() + "-" + this.to.toString();
    }
};

Move.prototype.packet = function() {
    if (!this.to) {
        return this.from.toString();
    } else {
        return { from: this.from.toString(), to: this.to.toString() };
    }
};