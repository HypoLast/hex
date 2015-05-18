;(function() {
    'use strict';
    var Game = window.Game = window.Game || {};

    var size = Game.HexSize = 45;
    Game.HexCorners = [
        {x: size, y: 0},
        {x: size * Math.cos(Math.PI / 3), y: size * Math.sin(Math.PI / 3)},
        {x: size * Math.cos(2 * Math.PI / 3), y: size * Math.sin(2 * Math.PI / 3)},
        {x: -size, y: 0},
        {x: size * Math.cos(4 * Math.PI / 3), y: size * Math.sin(4 * Math.PI / 3)},
        {x: size * Math.cos(5 * Math.PI / 3), y: size * Math.sin(5 * Math.PI / 3)},
    ];

    Game.HexCell = function(x, y, z) {
        x = x || 0;
        y = y || 0;
        z = z || 0;
        var rx = Math.round(x);
        var ry = Math.round(y);
        var rz = Math.round(z);

        var dx = Math.abs(rx - x);
        var dy = Math.abs(ry - y);
        var dz = Math.abs(rz - z);

        if (dx > dy && dx > dz) {
            rx = -ry-rz;
        } else if (dy > dz) {
            ry = -rx-rz;
        } else {
            rz = -rx-ry;
        }
        this.x = rx;
        this.y = ry;
        this.z = rz;
    };

    Game.HexCell.prototype.nAway = function(n) {
        var ret = [];
        var x = this.x;
        var y = this.y;
        var z = this.z;
        for (var i = 0; i < n; i ++) {
            // +/- x
            ret.push(new Game.HexCell(x + n, y - n + i, z - i));
            ret.push(new Game.HexCell(x - n, y + n - i, z + i));

            // +/- y
            ret.push(new Game.HexCell(x - i, y + n, z - n + i));
            ret.push(new Game.HexCell(x + i, y - n, z + n - i));
            
            // +/- z
            ret.push(new Game.HexCell(x - n + i, y - i, z + n));
            ret.push(new Game.HexCell(x + n - i, y + i, z - n));
        }
        return ret;
    };

    Game.HexCell.prototype.toString = function() {
        return this.x + ',' + this.y + ',' + this.z;
    };

    Game.HexCell.fromPixel = function(x, y) {
        var q = x * 2/3 / size;
        var r = (-x / 3 + Math.sqrt(3)/3 * y) / size;
        return new Game.HexCell(q, -q-r, r);
    };

    Game.HexCell.fromString = function(str) {
        var coords = str.split(",");
        var x = parseInt(coords[0]);
        var y = parseInt(coords[1]);
        var z = parseInt(coords[2]);
        return new Game.HexCell(x, y, z);
    };

    Game.HexCell.prototype.toPixel = function() {
        var x = size * 3/2 * this.x;
        var y = size * Math.sqrt(3) * (this.z + this.x/2);
        return {x: x, y: y};
    };

    Game.HexCell.prototype.distanceTo = function() {
        if (arguments.length === 0) {
            return (Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)) / 2;
        }
        return 0;
    };

    Game.HexCell.prototype.equals = function(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    };
})();