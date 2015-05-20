var TwoPlayerProblem = module.exports = function(problem) {
    if (!problem.edges || !problem.heuristic || !problem.dispose) throw new Error("Make sure your problem implements edges() and heuristic() and dispose()");
    this.problem = problem;
};

TwoPlayerProblem.prototype.toString = function() {
    if (this.problem.toString) {
        return this.problem.toString();
    } else {
        return "TwoPlayerProblem (" + typeof(this.problem) + ")";
    }
};

TwoPlayerProblem.prototype.minimax = function(depth, alpha, beta, maximizing, naive) {
    alpha = alpha || -Infinity;
    beta = beta || Infinity;
    if (depth === 0) return this.problem.heuristic();
    var children = this.problem.edges();
    if (!children || children.length === 0) return this.problem.heuristic();
    var myH;
    if (naive) {
        myH = this.problem.heuristic();
    }
    for (var i = children.length - 1; i >= 0; i--) {
        var edge = children[i];
        if (naive) {
            if (maximizing && edge.destination.problem.heuristic() < myH) continue;
            else if (!maximizing && edge.destination.problem.heuristic() > myH) continue;
        }
        if (maximizing) {
            alpha = Math.max(alpha, edge.destination.minimax(depth - 1, alpha, beta, false, naive));
        } else {
            beta = Math.min(beta, edge.destination.minimax(depth - 1, alpha, beta, true, naive));
        }
        if (beta <= alpha) {
            break;
        }
    };
    if (maximizing) {
        return alpha;
    } else {
        return beta;
    }
};

TwoPlayerProblem.prototype.nextMove = function(depth, naive) {
    if (!this.problem.canMove()) return null;
    var favoriteMove = null;
    var bestScore = -Infinity;
    var edges = this.problem.edges();
    if (edges.length === 1) return edges[0].move;
    for (var i = edges.length - 1; i >= 0; i--) {
        var score = edges[i].destination.minimax(depth, bestScore, Infinity, false, naive);
        edges[i].destination.problem.dispose(); // we cache a lot of things, make them all null so that they don't get stored longer than they have to
        if (score > bestScore || !favoriteMove) {
            bestScore = score;
            favoriteMove = edges[i].move;
        }
    };
    edges = null; // gc... come on
    return favoriteMove;
};

TwoPlayerProblem.Edge = function(source, move, destination) {
    this.source = source;
    this.move = move;
    this.destination = destination;
};

TwoPlayerProblem.Edge.prototype.toString = function() {
    return this.label;
};