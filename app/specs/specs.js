describe ("Get Magnitude", function() {
  it("returns present magnitude of ship vector", function() {
    var testShip = new Ship();
    testShip.getMagnitude().should.eq(0);
  });
});


