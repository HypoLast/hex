var HexCoord = module.exports = function(x, y, z) {
    x = x || 0;
    y = y || 0;
    z = z || 0;
    if (x + y + z != 0) throw new Error("illegal hex coordinate: " + x + ", " + y + ", " + z);
    this.x = x;
    this.y = y;
    this.z = z;
};

HexCoord.prototype.nAway = function(n) {
    var ret = [];
    var x = this.x;
    var y = this.y;
    var z = this.z;
    for (var i = 0; i < n; i ++) {
        // +/- x
        ret.push(new HexCoord(x + n, y - n + i, z - i));
        ret.push(new HexCoord(x - n, y + n - i, z + i));

        // +/- y
        ret.push(new HexCoord(x - i, y + n, z - n + i));
        ret.push(new HexCoord(x + i, y - n, z + n - i));
        
        // +/- z
        ret.push(new HexCoord(x - n + i, y - i, z + n));
        ret.push(new HexCoord(x + n - i, y + i, z - n));
    }
    return ret;
};

HexCoord.prototype.toString = function() {
    return this.x + ',' + this.y + ',' + this.z;
};

HexCoord.fromString = function(str) {
    try {
        var coords = str.split(",");
        var x = parseInt(coords[0]);
        var y = parseInt(coords[1]);
        var z = parseInt(coords[2]);
        return new HexCoord(x, y, z);
    } catch(e) {
        return null;
    }
};

HexCoord.prototype.distanceTo = function() {
    if (arguments.length === 0) {
        return (Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)) / 2;
    } else if (arguments.length === 1) {
        var other = arguments[0];
        return (Math.abs(this.x - other.x) + Math.abs(this.y - other.y) + Math.abs(this.z - other.z)) / 2;
    }
    return 0;
};

HexCoord.prototype.copy = function() {
    return new HexCoord(this.x, this.y, this.z);
};