;(function() {
    'use strict';
    var Game = window.Game = window.Game || {};

    function invertCoords(coords) {
        return {x: -coords.x, y: -coords.y};
    };

    function otherPlayersName(players) {
        for (var pName in players) {
            if (pName !== Game.SocketIO.username) return pName;
        }
    }

    Game.GameOutput = {
        currentBoard: undefined,

        drawBoard: function(board) {
            if (board) {
                this.currentBoard = board;
            } else {
                board = this.currentBoard;
                if (!board) return;
            }
            var grid = board.grid;
            var ctx = Game.ctx;
            ctx.save();
            var corners = Game.HexCorners;
            var flipBoard = board.players[Game.SocketIO.username] === "red";
            ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
            ctx.font = "50px Verdana";
            ctx.textAlign = "center";
            for (var cell in grid) {
                var hc = Game.HexCell.fromString(cell);
                var spot = hc.toPixel();
                if (flipBoard) {
                    spot = invertCoords(spot);
                }
                spot.x += 400;
                spot.y += 300;
                ctx.beginPath();
                ctx.moveTo(spot.x + corners[0].x, spot.y + corners[0].y);
                for (var i = 1; i < corners.length; i ++) {
                    ctx.lineTo(spot.x + corners[i].x, spot.y + corners[i].y);
                }
                ctx.closePath();
                if (grid[cell]) {
                    ctx.fillStyle = grid[cell].color;
                    ctx.fill();
                    ctx.fillStyle = "black";
                    ctx.fillText(grid[cell].size, spot.x, spot.y + 20);
                }
                ctx.stroke();
            }

            // turn indicator
            ctx.fillStyle = "orange";
            ctx.beginPath();
            if (board.playersTurn === Game.SocketIO.username) {
                ctx.arc(30, 540, 20, 0, 2 * Math.PI, false);
            } else {
                ctx.arc(30, 60, 20, 0, 2 * Math.PI, false);
            }
            ctx.fill();
            ctx.stroke();

            // player names
            ctx.textAlign = "left";
            ctx.font = "20px Verdana";
            ctx.fillStyle = "black";
            ctx.fillText(Game.SocketIO.username, 60, 550);
            ctx.fillText(otherPlayersName(board.players), 60, 70);
            
            // color indicators
            ctx.fillStyle = board.players[otherPlayersName(board.players)];
            ctx.beginPath();
            ctx.arc(750, 50, 10, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.fillStyle = board.players[Game.SocketIO.username];
            ctx.beginPath();
            ctx.arc(750, 550, 10, 0, 2 * Math.PI, false);
            ctx.fill();

            // highlights
            var highlights = Game.GameInput.getMoveHighlights(board);
            ctx.fillStyle = "green";
            ctx.globalAlpha = .3;
            for (var i = 0; i < highlights.length; i ++) {
                var spot = highlights[i].toPixel();
                if (flipBoard) {
                    spot = invertCoords(spot);
                }
                spot.x += 400;
                spot.y += 300;
                ctx.beginPath();
                ctx.arc(spot.x, spot.y, Game.HexSize - 15, 0, 2 * Math.PI, false);
                ctx.fill();
            }
            ctx.restore();
        },
        linkListeners: function() {
            var that = this;
            
            function board(b) {
                that.drawBoard(b);
            };

            function gameWon() {
                that.unlinkListeners();
                Game.showPopup("standard", "You won the game.", function() {
                    Game.showScreen("lobby", true);
                    Game.hidePopup();
                });
            };

            function gameLost() {
                that.unlinkListeners();
                Game.showPopup("standard", "You lost the game.", function() {
                    Game.showScreen("lobby", true);
                    Game.hidePopup();
                });
            };

            function gameDraw() {
                that.unlinkListeners();
                Game.showPopup("standard", "The game was a draw.", function() {
                    Game.showScreen("lobby", true);
                    Game.hidePopup();
                });
            };

            Game.SocketIO.emitter.on("board", board);
            Game.SocketIO.emitter.on("gameWon", gameWon);
            Game.SocketIO.emitter.on("gameLost", gameLost);
            Game.SocketIO.emitter.on("gameDraw", gameDraw);
        },
        unlinkListeners: function() {
            Game.SocketIO.emitter.removeAllListeners("board");
            Game.SocketIO.emitter.removeAllListeners("gameWon");
            Game.SocketIO.emitter.removeAllListeners("gameLost");
            Game.SocketIO.emitter.removeAllListeners("gameDraw");
        }
    }
})();