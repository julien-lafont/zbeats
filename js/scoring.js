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

  var goodNotes = (function(seq1, seq2) {
    var good = 0
    for (var i = 0; i < seq1.length; i++) {
      var rec1 = seq1[i]
      var rec2 = seq2[i]
      if (rec1.key == rec2.key) good++
    }
    return good
  })(seq1, seq2)

  var percent = (function(seq1, goodNotes) {
    var nb = seq1.length
    return Math.round(goodNotes * 100 / nb)
  })(seq1, goodNotes)

  var level = function(diff) {
    if (diff < 0.05 && percent == 100) return "AAA"
    else if (diff < 0.1 && percent == 100) return "AA"
    else if (diff < 0.2 && percent == 100) return "A"
    else if (diff < 0.5 && percent > 90) return "B"
    else if (diff < 1) return "C"
    else return "F"
  }

  return {
    time: Math.round(diff * 100) / 100,
    level: level(diff),
    percent: percent
  }
}