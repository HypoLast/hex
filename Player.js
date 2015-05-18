var Player = module.exports = function(username, socket) {
    this.location = "lobby";
    this.game = undefined;
    this.username = username;
    this.socket = socket;
    this.engagedPlayer = undefined;
};