module.exports = function() {
    var that = this;
    this.username = "default";
    this.socket =  {
        emit: function() {},
        on: function(_, sm) { that.sendMove = sm; }
    };
    this.sendMove = undefined;
};