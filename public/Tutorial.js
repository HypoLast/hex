;(function() {
    'use strict';
    var Game = window.Game = window.Game || {};

    Game.Tutorial = {
        currentSlide: undefined,
        numSlides: 9,
        init: function() {
            this.currentSlide = 1;
            this.showSlide(1);
            document.getElementById('tutorial-previous').onclick = this.previousSlide;
            document.getElementById('tutorial-next').onclick = this.nextSlide;
            document.getElementById('tutorial-back-to-lobby').onclick = this.backToLobby;
        },
        nextSlide: function() {
            var that = Game.Tutorial;
            that.hideSlide(that.currentSlide);
            if (that.currentSlide < that.numSlides) {
                that.currentSlide ++;
            }
            that.showSlide(that.currentSlide);
        },
        previousSlide: function() {
            var that = Game.Tutorial;
            that.hideSlide(that.currentSlide);
            if (that.currentSlide > 1) {
                that.currentSlide --;
            }
            that.showSlide(that.currentSlide);  
        },
        backToLobby: function() {
            Game.showScreen("lobby", true);
        },
        showSlide: function(n) {
            document.getElementById('tutorial' + n).style.display = "block";
        },
        hideSlide: function(n) {
            document.getElementById('tutorial' + n).style.display = "none";
        }
    }
})();