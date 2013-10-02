function Replayer(buzzers) {

  var run = function(seq) {
    if (!seq.length) return;

    var head = _.head(seq)
    var tail = _.tail(seq)
    setTimeout(function() {
      var beat = buzzers[head.key]
      beat.start()
      setTimeout(function() {
        beat.stop()
        run(tail)
      }, head.duration * 1000)
    }, head.wait * 1000)
  }

  return {
    run: run
  }
}