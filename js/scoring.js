function Scoring(seq1, seq2) {
  var diff = (function(seq1, seq2) {
    var diff = 0.0
    for (var i = 0; i < seq1.length; i++) {
      var rec1 = seq1[i]
      var rec2 = seq2[i]
      diff += Math.abs(rec1.wait - rec2.wait)
      diff += Math.abs(rec1.duration - rec2.duration)
    }
    return diff
  }(seq1, seq2))

  var level = function(diff) {
    if (diff < 0.05) return "AAA"
    else if (diff < 0.1) return "AA"
    else if (diff < 0.2) return "A"
    else if (diff < 0.5) return "B"
    else if (diff < 1) return "C"
    else return "F"
  }

  return {
    time: diff,
    level: level(diff) 
  }
}