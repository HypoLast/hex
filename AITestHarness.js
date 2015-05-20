var HexProblem = require("./AI/HexProblem");
var TwoPlayerProblem = require("./AI/TwoPlayerProblem");
var Game = require("./Game");
var HeadlessPlayer = require("./HeadlessPlayer");

var p1 = module.exports.p1 = new HeadlessPlayer();
p1.username = "player1";
var p2 = module.exports.p2 = new HeadlessPlayer();
p2.username = "player2";

var game = module.exports.game = new Game(p1, p2);

var nextMove = module.exports.nextMove = function(d) {
    var tpp = new TwoPlayerProblem(new HexProblem(game.packState(), "player2"));
    return tpp.nextMove(d);
};

console.log(nextMove());
p1.sendMove("0,-3,3");
var nm = nextMove(6);
console.log(nm);
p2.sendMove(nm.packet());
p1.sendMove({from: "0,-3,3", to: "0,-2,2"});
nm = nextMove(6);
console.log(nm);
p2.sendMove(nm.packet());