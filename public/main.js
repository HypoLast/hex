;(function() {
    'use strict';
    var Game = window.Game = window.Game || {};

    function validateUsername(username) {
        if (username.length < 3 || username.length > 16) return false;
        var match = username.match(/[_0-9a-zA-Z]+/);
        return match != null && username == match[0];
    };

    Game.challenge = function(name) {
        Game.SocketIO.challenge(name);
        Game.showPopup("standard", "Waiting for  " + name + " to respond...", cancelChallenge, "Cancel");
    };

    function challenged(name) {
        Game.hidePopup();
        Game.showPopup("yesno", "You were challenged by " + name, challengeAcknowledge);
    };

    function challengeAcknowledge(accepted) {
        Game.hidePopup()
        if (accepted) {
            Game.SocketIO.acceptChallenge();
        } else {
            Game.SocketIO.declineChallenge();
        }
    };

    function startGame() {
        Game.hidePopup();
        Game.showScreen("gameScreen", true);
        Game.GameOutput.linkListeners();
        Game.GameInput.linkMouse();
    };

    function challengeDeclined(reason) {
        Game.hidePopup();
        Game.showPopup("standard", "Challenge declined. " + reason);
    };

    function cancelChallenge() {
        Game.SocketIO.cancelChallenge();
        Game.hidePopup();
    };

    function challengeCancelled() {
        Game.hidePopup();
        Game.showPopup("standard", "The challenge was cancelled.");
    };

    function submitUsername() {
        var username = document.forms["username"]["username"].value;
        username = username.trim();
        if (validateUsername(username)) {
            Game.hideScreens();
            Game.SocketIO.joinLobby(username);
            Game.SocketIO.emitter.on("nameInUse", function() {
                Game.SocketIO.emitter.removeAllListeners();
                Game.showPopup("standard", "That name is already in use.")
                Game.showScreen("chooseUsername");
            });
            Game.SocketIO.emitter.on("joinLobby", function() {
                Game.SocketIO.emitter.removeAllListeners();
                joinLobby();
            });
            Game.SocketIO.emitter.on("invalidName", function() {
                Game.SocketIO.emitter.removeAllListeners();
                Game.showPopup("standard", "Username must be 3 to 6 letters long and cannot contain special characters.");
                Game.showScreen("chooseUsername");
            });
        } else {
            Game.showPopup("standard", "Username must be 3 to 6 letters long and cannot contain special characters.");
        }
        return false;
    };

    function playerBarHtml(name) {
        var html = "<button ";
        if (name === Game.SocketIO.username) {
            html += "style='display: none;' ";
        }
        html += "onclick=\"Game.challenge('" + name + "');\">Challenge</button> " + name;
        if (name === Game.SocketIO.username) {
            html += " (you)";
        }
        return html
    };

    function joinLobby() {
        Game.showScreen("lobby");
        Game.SocketIO.emitter.on("playerJoinedLobby", playerJoinedLobby);
        Game.SocketIO.emitter.on("playerLeftLobby", playerLeftLobby);
        Game.SocketIO.emitter.on("playerUnavailable", playerUnavailable);
        Game.SocketIO.emitter.on("playerAvailable", playerAvailable);
        
        Game.SocketIO.emitter.on("startGame", startGame);
        Game.SocketIO.emitter.on("challengeDeclined", challengeDeclined);
        Game.SocketIO.emitter.on("challengeCancelled", challengeCancelled);
        Game.SocketIO.emitter.on("challenged", challenged);
    };

    function playerJoinedLobby(joinData) {
        var bar = document.createElement("div");
        bar.className = "player-bar";
        bar.id = joinData.name + "-bar";
        bar.innerHTML = playerBarHtml(joinData.name);
        Game.playerList.appendChild(bar);
        if (!joinData.available) {
            playerUnavailable(name);
        }
    };

    function playerLeftLobby(name) {
        document.getElementById(name + "-bar").remove();
    };

    function playerUnavailable(name) {
        document.getElementById(name + "-bar").children[0].disabled = true;
    };

    function playerAvailable(name) {
        document.getElementById(name + "-bar").children[0].disabled = false;
    };

    Game.hideScreens = function() {
        for (var screen in Game.screens) {
            Game.screens[screen].style.display = "none";
        }
    };

    Game.showScreen = function(screenName, hideOthers) {
        if (hideOthers) {
            Game.hideScreens();
        }
        Game.screens[screenName].style.display = "block";
    };

    function okPopupButtonClick() {
        if (Game.popupCallback) Game.popupCallback();
        else Game.hidePopup();
    };

    function yesPopupButtonClick() {
        if (Game.popupCallback) Game.popupCallback(true);
        else Game.hidePopup();
    };

    function noPopupButtonClick() {
        if (Game.popupCallback) Game.popupCallback(false);
        else Game.hidePopup();
    };

    window.onload = function() {
        // http://stackoverflow.com/questions/3387427/remove-element-by-id
        Element.prototype.remove = function() {
            this.parentElement.removeChild(this);
        }

        Game.SocketIO.init();
        Game.screens = {
            chooseUsername: document.getElementById('chooseUsername'),
            lobby: document.getElementById('lobby'),
            gameScreen: document.getElementById('gameScreen')
        };
        Game.playerList = document.getElementById('player-list');
        Game.overlayBg = document.getElementById('overlay-bg');
        Game.standardPopup = document.getElementById('standard-popup');
        Game.yesnoPopup = document.getElementById('yesno-popup');
        Game.okPopupButton = document.getElementById('ok-popup-button');
        Game.yesPopupButton = document.getElementById('yes-popup-button');
        Game.canvas = document.getElementById('canvas');
        Game.ctx = Game.canvas.getContext('2d');
        document.forms["username"].onsubmit = submitUsername;
        document.getElementById("ok-popup-button").onclick = okPopupButtonClick;
        document.getElementById("yes-popup-button").onclick = yesPopupButtonClick;
        document.getElementById("no-popup-button").onclick = noPopupButtonClick;

        Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
    };

    Game.showPopup = function(type, text, fn, okButtonText) {
        var popup = document.getElementById(type + "-popup");
        Game.overlayBg.style.display = "block";
        popup.style.display = "inline-block";
        document.getElementById(type + "-text").innerHTML = text;
        if (okButtonText) {
            Game.okPopupButton.innerHTML = okButtonText;
        } else {
            Game.okPopupButton.innerHTML = "OK";
        }
        Game.popupCallback = fn;
        if (type === "standard") {
            Game.okPopupButton.focus();
        } else if (type === "yesno") {
            Game.yesPopupButton.focus();
        }
    };

    Game.hidePopup = function() {
        Game.overlayBg.style.display = "none";
        Game.standardPopup.style.display = "none";
        Game.yesnoPopup.style.display = "none";
    };
})();