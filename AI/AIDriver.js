var HexProblem = require("./HexProblem");
var TwoPlayerProblem = require("./TwoPlayerProblem");

var username = process.argv[2];

process.on("message", function(message) {
    var signal = message.signal;
    if (signal === "board") {
        makeMoveOnBoard(message.payload);
    } else if (signal === "gameLost" || signal === "gameWon" || signal === "gameDraw") {
        process.removeAllListeners();
    }
});

function makeMoveOnBoard(board) {
    var problem = new HexProblem(board, username);
    if (problem.canMove()) {
        var tpp = new TwoPlayerProblem(problem);
        var move = tpp.nextMove(Math.min(5, Math.max(2, Math.floor(problem.volatility() * .75))), true);
        if (move) {
            process.send(move.packet());
        } else {
            console.log("no move");
        }
    }
};