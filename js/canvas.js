window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
})();


function Vector(v1, v2 ) {
  var minVel = 0.1;
    this.v1 = v1;
    this.v2 = v2;
}

Vector.prototype.set = function(n1, n2 ) {
  this.v1 = n1;
  this.v2 = n2;

  return this;
};

Vector.prototype.getX = function(){
  return this.v1; 
}

Vector.prototype.getY = function(){
  return this.v2;
}

Vector.prototype.average = function( vectors ) {
  //loop through each vector and add to x and y arrays
  var v1Ave = 0,
      v2Ave = 0,
      vLen = vectors.length;

  for( var i = 0; i < vLen; i++) {
      v1Ave += vectors[i].velocity.getX();
      v2Ave += vectors[i].velocity.getY();
  }

  v1Ave = v1Ave / vLen;
  v2Ave = v2Ave / vLen;
  return { x: v1Ave, y: v2Ave }
}

var canvas = (function(){
  var el,
      ctx,
      centreX,
      centreY,
      boidSize = 2,
      rAF = window.requestAnimationFrame,
      boidList = [],
      boidCount = 50;
  
  function randNum( num ) {
    return Math.round( Math.random() * num );
  }

  function init(){
    //setup
    el = document.getElementById('canvas');
    ctx = el.getContext('2d');    
    createResizeHandler();
    
    for( var i = 0; i < boidCount; i++ ){
      boidList.push( createBoid( i+1 ) );
    }
    
    doTick();
  }
  
  function createResizeHandler(){
    if( window.addEventListener ){
      window.addEventListener('resize', resize(), true );
    }else{
      window.attachEvent('onresize', resize() );
    }
  }
  
  function doTick(){
    requestAnimFrame( doTick );
    ctx.clearRect(0,0,el.width, el.height);
    animateBoids();
  }
  function animateBoids(){
    for( var i = boidList.length; i > 0; i-- ) {
      var boidNeighbours = boidList[i-1].neighbours,
          boid = boidList[i-1];

      if( boidNeighbours.length === 0 ){
        boid.setNeighbours(boidList)
      }
      boid.move();
      boid.render();
    }
    
  }
  
  function resize(){
    el.width = window.innerWidth;
    el.height = window.innerHeight;
    centreX = Math.floor(el.width / 2);
    centreY = Math.floor(el.height / 2);
    
  }
  
  function addBoid(e) {
    var x = e.pageX,
        y = e.pageY,
        bId = boidList.length + 1;
    boidList.push( createBoid(bId, x, y) );
  }
  
  function createBoid(bId, startX, startY, size ){
    var boid = {},
        varienceX = Math.round(Math.random() * centreX),
        varienceY = Math.round(Math.random() * centreY),
        boidX = (typeof startX !== "undefined") ? startX : centreX,
        boidY = (typeof startY !== "undefined") ? startY : centreY;

        if( typeof startX === "undefined") {
          boidX = ( (varienceX%2) === 0 ) ? boidX + varienceX : boidX - varienceX;
          boidY = ( (varienceY%2) === 0 ) ? boidY + varienceY : boidY - varienceY;
        }

        boid.id = bId;
        boid.centreX = boidX;
        boid.centreY = boidY;
        boid.velocity = new Vector( (randNum( 2 ) - 1 ), ( randNum(2) - 1 ) );
        boid.size = (typeof size !== "undefined" ) ? size : boidSize,
        boid.colour = (typeof startX !== "undefined") ? 'rgba(255,0,0,1)' : 'rgba(0,0,0,1)';
        boid.cohesionDistance = 15;
        boid.flockDistance = 75;
        boid.neighbours = [];


    boid.render = function(){
      if( startX ){
        ctx.fillStyle = boid.colour;
      }else{
        ctx.fillStyle = boid.colour;
      }
      ctx.fillRect( this.centreX, this.centreY, this.size, this.size );
    }
    
    boid.checkBounds = function() {
      if( this.centreX > el.width ) {
        this.centreX = 0;
      }
      
      if( this.centreY > el.height ) {
        this.centreY = 0;
      }
      
      if( this.centreX < 0 ) {
        this.centreX = el.width;
      }
      
      if( this.centreY < 0 ) {
        this.centreY = el.height;
      }
    }

    boid.setNeighbours = function( boids ) {
      var bLen = boids.length;

      for(var i=0; i < bLen; i++ ) {
        if( boids[i].id === this.id) {
          continue;
        }

        this.neighbours.push( boids[i] );
      }
    }

    boid.getVector = function(){
      return this.vector;
    }

    boid.checkRadius = function( radius ){
      //loop through neighbours and check distance
      var neighbourLen = this.neighbours.length,
          neighbourVect = [];

      for( var i= 0; i < neighbourLen; i++){
        var neighbour = this.neighbours[i],
            nX = neighbour.centreX,
            nY = neighbour.centreY;

        //if neighbour is within the radius affecting cohesion, add to return array for averaging
        if( Math.sqrt(Math.pow((nX - this.centreX), 2) + Math.pow((nY - this.centreY) , 2) ) < radius ) {
          neighbourVect.push(neighbour);
        }

      }
      
      return neighbourVect;

    }

    boid.checkCohesion = function(){
      return this.checkRadius( this.cohesionDistance );
    }

    boid.checkFlocks = function(){
      return this.checkRadius( this.flockDistance );
    }

    boid.move = function() {
      //check radius
      var neighbours = this.checkCohesion();

      if( neighbours.length ) {
        var newVelocity = this.velocity.average( neighbours );
        this.steer( newVelocity.x, newVelocity.y );
      }

      //check a wider radius for other flocks and steer towards them
      //var flocks = this.checkFlocks();

      // if( flocks ){
      //   flockVelocity = this.velocity.average( flocks );
      //   this.steer( flockVelocity.x, flockVelocity.y );
      // }

      this.centreX += this.velocity.getX();
      this.centreY += this.velocity.getY();
      this.checkBounds();
    }

    boid.steer = function(nX, nY ) {
      // var oX = this.velocity.getX(),
      //     oY = this.velocity.getY();
      this.velocity.set( nX  , nY );
    }

    return boid;
  }

  return { init: init, resize: resize, addBoid: addBoid, boidList: boidList}

})();


$(function(){
  canvas.init();
  
  $("#canvas").click( function(e) {
    canvas.addBoid(e)
  });
  
});
