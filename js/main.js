window.onload = () => {
  var dist = document.getElementById("dist");

  var frow = new waterflowGetter(WATERFLOWSIGPORT, WATERFLOWFLAG, true);
  frow.start(dist);
};
