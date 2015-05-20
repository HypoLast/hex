var fork = require("child_process").fork;
var path = require("path");

var AIAdapter = module.exports = function(username) {
    var that = this;
    this.username = username;
    this.ai = fork(path.join(__dirname, "AIDriver.js"), [username]);
    this.socket = {
        removeAllListeners: function() {
            that.move = undefined;
            that.concede = undefined;
        },
        on: function(signal, fn) {
            if (signal === "concede") {
                that.concede = fn;
            } else if (signal === "move") {
                that.move = fn;
            }
        },
        emit: function(signal, payload) {
            try {
                that.ai.send({signal: signal, payload: payload});
            } catch(e) {}
        }
    };
    this.move = undefined;
    this.concede = undefined;
    this.ai.on("message", function(move) {
        if (that.move) {
            that.move(move);
        }
    });
    this.ai.on("close", function() {
        that.ai.removeAllListeners();
        if (that.concede) {
            that.concede("concede");
        }
    });
};