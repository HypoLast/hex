;(function() {
    'use strict';
    var Game = window.Game = window.Game || {};

    function invertCoords(coords) {
        return {x: -coords.x, y: -coords.y};
    };

    function canvasMousePosition(event) {
        var rect = Game.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        var canvasX = x / rect.width * canvas.width;
        var canvasY = y / rect.height * canvas.height;
        return {x: canvasX, y: canvasY};
    };

    function canvasMousePosition(event, canvas) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        var canvasX = x / rect.width * canvas.width;
        var canvasY = y / rect.height * canvas.height;
        return {x: canvasX, y: canvasY};
    }

    Game.GameInput = {
        currentBoard: undefined,
        calculatedMoves: undefined,
        selectedCell: undefined,
        startMoves: undefined,

        calculateLegalMoves: function(board) {
            if (board === this.currentBoard) return this.calculatedMoves;
            this.currentBoard = board; 
            if (board.playersTurn !== Game.SocketIO.username) {
                this.calculatedMoves = {};
                this.startMoves = [];
                return this.calculatedMoves;
            }
            var myColor = board.players[Game.SocketIO.username];
            this.calculatedMoves = {};
            this.startMoves = [];
            for (var cell in board.grid) {
                if (board.grid[cell] && board.grid[cell].color == myColor) {
                    var hex = Game.HexCell.fromString(cell);
                    this.startMoves.push(hex);
                    this.calculatedMoves[cell] = [];
                    var provisional = hex.nAway(board.grid[cell].size);
                    for (var i = 0; i < provisional.length; i ++) {
                        if (provisional[i].distanceTo() <= 3) {
                            this.calculatedMoves[cell].push(provisional[i]);
                        }
                    }
                }
            }
            if (!board.grid["0,-3,3"] && myColor === "blue") {
                this.startMoves.push(new Game.HexCell(0, -3, 3));
            } else if (!board.grid["0,3,-3"] && myColor === "red") {
                this.startMoves.push(new Game.HexCell(0, 3, -3));
            }
        },

        getMoveHighlights: function(board) {
            this.calculateLegalMoves(board);
            if (this.selectedCell) {
                return this.calculatedMoves[this.selectedCell];
            } else {
                return this.startMoves;
            }
        },

        hasLegalMove: function(hex) {
            if (!this.startMoves || !this.calculatedMoves) return;
            if (!this.selectedCell) {
                for (var i = 0; i < this.startMoves.length; i ++) {
                    if (hex.equals(this.startMoves[i])) return true;
                }
            } else {
                var repr = this.selectedCell.toString();
                if (!this.calculatedMoves[repr]) return false;
                for (var i = 0; i < this.calculatedMoves[repr].length; i ++) {
                    if (hex.equals(this.calculatedMoves[repr][i])) return true;
                }
            }
        },

        linkMouse: function() {
            var that = this;
            Game.canvas.onmousedown = function(e) {
                var canvasPos = canvasMousePosition(e, Game.canvas);
                canvasPos.x -= 400;
                canvasPos.y -= 300;
                if (that.currentBoard && that.currentBoard.players[Game.SocketIO.username] === "red") {
                    canvasPos = invertCoords(canvasPos);
                }
                var cellClicked = Game.HexCell.fromPixel(canvasPos.x, canvasPos.y);
                if (cellClicked.distanceTo() > 3) return;
                if (that.hasLegalMove(cellClicked)) {
                    if (!that.selectedCell) {
                        if (that.calculatedMoves[cellClicked.toString()]) {
                            that.selectedCell = cellClicked;
                            Game.GameOutput.drawBoard();
                        } else {
                            Game.SocketIO.move(cellClicked.toString());
                        }
                    } else {
                        Game.SocketIO.move({from: that.selectedCell.toString(), to: cellClicked.toString()});
                        that.selectedCell = undefined;
                    }
                } else {
                    that.selectedCell = undefined;
                }
                Game.GameOutput.drawBoard();
            }
        },

        unlinkMouse: function() {

        }
    }
    
})();