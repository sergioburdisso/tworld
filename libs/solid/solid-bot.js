/*
 *Author: 	Burdisso Sergio
 *
 *Review: 	this file contains a Bot class which user can use for implementing autonomous agents based on
 *			steering behaviors
 */
 
SolidBot.BorderType = {None : 0, Infinite : 1, Solid : 2};
 function SolidBot(args){
	//region Arguments default value mapping
		var BorderType = SolidBot.BorderType;
		args = $.extend(
		{
			$bot			: null,
			idDOMParent 	: "body",
			cssClass		: "bots",
			borderType 		: BorderType.Solid,
			rotate			: true,
			location 		: new Vector(),
			velocity 		: new Vector(Math.random()*2-1, Math.random()*2-1),
			acceleration 	: new Vector(),
			maxVelocity 	: 2,
			maxSteeringForce: 0.075,
			wanderBehavior 	: $.extend({
								radius : 40, 	// Radius for our "wander circle"
								distance : 80,	// Distance for our "wander circle"
								change: 90 		// Randomness threshold in degrees
							}, args.wander),
			desiredSeparation: 50, 		// Desired separation from another bots
			neighborDistance : 100,		// How close a bot should be to a "neighbor"
			html: "S"
		},  args);
	//end region Arguments default value mapping
	//
 	//region Attributes
 		//static:
	 	SolidBot.Counter = SolidBot.Counter+1 || 0;

 		//private:
	 	var _loc = args.location; //Location point
	 	var _vel = args.velocity; //Velocity vector
	 	var _acc = args.acceleration; //Acceleration vector
	 	
	 	var _maxVel = args.maxVelocity; // Maximum velocity
	 	var _maxSteerForce = args.maxSteeringForce; // Maximum steering force

	 	var _wanderKnobs = 	args.wanderBehavior; // Wander behavior parameters

	 	var _separation = args.desiredSeparation; // This variable specifies how close is "too close"
	 	var _neighborhood = args.neighborDistance; // This variable specifies how close a bot should be to a "neighbor"

	 	var _fixedLocation = _loc.copy(); // In case we want the bot to stay at a fixed position

	 	var _idDOM = "#bot"+ SolidBot.Counter;
	 	var _$bot = !args.$bot? $(_idDOM) : args.$bot;
	 	var _$parent = $(args.idDOMParent);
	 	var _self = this;
 	//end region Attributes
 	//
 	//region Methods
 		//region Public Methods
	 		//main function to operate object
			this.display = function() {
				update();

				if (args.borderType == BorderType.Infinite)
					noBorders();
				else
				if (args.borderType == BorderType.Solid)
					borders();

				render();
			}

			//applies a force to the bot acceleration
			this.applyForce = function(v) {
				_acc.add(v);
			}

			this.seek = function(targetVec) {
				this.applyForce(seekVec(targetVec));
			}

			this.arrive = function(targetVec) {
				this.applyForce(arriveVec(targetVec));
			}

			this.wander = function() {
				this.applyForce(wanderVec());
			}

			this.stayThere = function(location) {
				this.applyForce(stayThereVec(location));
			}
	
			this.avoid = function(location, distance) {
				this.applyForce(avoidVec(location, distance));
			}

			this.separate = function(bots) {
				this.applyForce(separateVec(bots));
			}

			this.cohesion = function(bots) {
				this.applyForce(cohesionVec(bots));
			}

			this.align = function(bots) {
				this.applyForce(alignVec(bots));
			}

			this.flee = function(badBots) {
				this.applyForce(fleeVec(badBots));
			}

			this.seekAndSeparate = function(targetVec, bots) {
				this.applyForce(separateVec(bots).mult(1.1));
				this.applyForce(seekVec(targetVec).mult(0.8));
				this.applyForce(wanderVec().mult(0.1));
			}

			this.flock = function(bots) {
				this.applyForce(separateVec(bots).mult(1));
				this.applyForce(cohesionVec(bots).mult(0.5));
				this.applyForce(alignVec(bots).mult(1));
				this.applyForce(wanderVec().mult(2));
			}

			this.stayThereAndFleeFrom = function(location, bots) {
				this.applyForce(stayThereVec().mult(0.5));

				if (!avoidVec(location, 100).isEqual(0,0,0)){

					this.applyForce(avoidVec(location, 70).mult(0.75));
					this.applyForce(wanderVec().mult(0.5));
					this.applyForce(separateVec(bots).mult(1.1));

				}
			}

			this.getVelocity = function(){return _vel;}
			this.getLocation = function(){return _loc;}
			this.getAcceleration = function(){return _acc;}

			this.setVelocity = function(v){_vel.assign(v);return this;}
			this.setLocation = function(v, y){_loc.assign(v, y);return this;}
			this.setAcceleration = function(v){_acc.assign(v);return this;}
			this.setMaximumVelocity = function(value){_maxVel = value;return this;}
			this.setMaximumSteeringForce = function(value){_maxSteerForce = value;return this;}
		//end region Public Methods
		//
		//region Private Methods

			//function to update location
			function update() {
				_vel.add(_acc);
				_vel.limitNorm(_maxVel);

			    _loc.add(_vel);

			    _acc.assign(0,0);
			}

			//function to enforce position constrains
			function borders() {
				var _x0=0, _x1=_x0+_$parent.width();
				var _y0=0, _y1=_y0+_$parent.height();

				var steerForce = 0.1;
				if (!this.steer)
					this.steer = new Vector();
				else
					this.steer.assign(0,0);

				if (_loc.x < _x0+ 25)
					this.steer.assign(steerForce*1.75, 0);
				else
					if (_loc.x > _x1 - 30)
						this.steer.assign(-steerForce*1.75, 0);

				if (_loc.y < _y0 + 25)
					this.steer.assign(this.steer.x, steerForce*1.75);
				else
					if (_loc.y > _y1 - 30)
						this.steer.assign(this.steer.x, -steerForce*1.75);

				_self.applyForce(this.steer);
			}

			function noBorders() {
				var _x0=0, _x1=_x0+_$parent.width();
				var _y0=0, _y1=_y0+_$parent.height();

				if (_loc.x < _x0-60) _loc.x = _x1;
				if (_loc.y < _y0-60) _loc.y = _y1-40;
				if (_loc.x > _x1) _loc.x = _x0;
				if (_loc.y > _y1-_vel.y*20) _loc.y = _y0;
			}

			//function to display
			function render() {
				var angle;

				if (args.rotate){
					angle = _vel.getAngle();
					_$bot.css({'-webkit-transform' : 'rotate('+angle+'deg)', '-moz-transform' : 'rotate('+angle+'deg)'});
				}

				_$bot.css({position: 'absolute', left : _loc.x +'px', top : _loc.y + 'px'});
			}

			function isNotTooFar(v, u, discante) {
				return 	Math.abs(v.x - u.x) < discante &&
						Math.abs(v.y - u.y) < discante;
			}

			// function that calculates a steering vector towards a target
			// Steering = Desired - Velocity
			function steer(targetV, slowdown){
				//region variables declaration
					var norm;

					if (!this.desired){
						this.desired = new Vector();
						this.steer = new Vector();	//Steering vector
					}
				//end region variables declaration

				// Desired vector's a vector pointing from the location to the target
				this.desired.assign(targetV).sub(_loc);

				if ((norm = this.desired.getNorm()) != 0) {
					// Normalize desired vector and...
					this.desired.normalize();
					//..give it a magnitude determined by...
					if (slowdown && norm < 100)
						this.desired.mult(_maxVel*(norm/100)); //...the inverse of the distance from the bot to the target
					else
						this.desired.mult(_maxVel); //..._maxVel
					// Steering = Desired - Velocity
					this.steer.assign(this.desired).sub(_vel); 
					// Limit to maximum steering force
					this.steer.limitNorm(_maxSteerForce); 
				}else
					this.steer.assign(0,0);

				return this.steer;
			}

			function arriveVec(targetVec) {
				return steer(targetVec, true);
			}

			function seekVec(targetVec) {
				return steer(targetVec);
			}

			function wanderVec() {
				//region variables declaration
					if (!this.circleLoc){
						this.circleLoc = new Vector();
						this.circleOffset = new Vector();
					}
				//end region variables declaration

				//the wander circle location's a vector with the same direction than the velocity vector
				//but with a norm of _wanderKnobs.distance, relative to the bot location (_loc vector)
				this.circleLoc.assign(_vel);
				this.circleLoc.setNorm(_wanderKnobs.distance);			
				this.circleLoc.add(_loc); //Make it relative to the bot's location

				this.circleOffset.assign(_loc).sub(this.circleLoc);
				this.circleOffset.setNorm(_wanderKnobs.radius);

				// Randomly change wander theta ( theta += random(-change, change); )
				this.circleOffset.rotate(Math.random()*(2*_wanderKnobs.change)-_wanderKnobs.change);
				this.circleOffset.add(this.circleLoc);

				return seekVec(this.circleOffset);
			}

			function avoidVec(location, distance) {
				var d = _loc.getDistanceTo(location);

				if (!this.steer)
					this.steer = new Vector();
				else
					this.steer.assign(0,0);


				// if location is "too close"...
				if (d < distance){
					this.steer.assign(_loc).sub(location);

					//the closer it is, the more we should steer
					this.steer.div(d);
				}

				return this.steer;
			}
			
			function stayThereVec(location) {
				if (location)
					_fixedLocation.assign(location);

				return arriveVec(_fixedLocation);
			}
			
			function alignVec (bots) {
				//region variables declaration
					var counter = 0;
					if (!this.sumVec){
						this.sumVec = new Vector();
						this.steer = new Vector();
					}else{
						this.sumVec.assign(0,0);
						this.steer.assign(0,0);
					}
				//edn region variables declaration

				//Add up all the velocities and divide by the total to calculate the average velocity
				for (var i= 0, d; i < bots.length; i++){

					if (isNotTooFar(_loc, bots[i].getLocation(), _neighborhood)){

						d = _loc.getDistanceTo(bots[i].getLocation());

						// if bots[i] is a "neighbor"...
						if ((d > 0) && (d < _neighborhood)){
							this.sumVec.add(bots[i].getVelocity());
							counter++;
						}
					}				
				}

				if (counter > 0){
					this.sumVec.div(counter);

					//We desire to go in that direction at maximum speed
					this.sumVec.setNorm(_maxVel);

					//Reynolds’s steering force formula
					this.steer.assign(this.sumVec).sub(_vel);
					this.steer.limitNorm(_maxSteerForce);
				}
				
				return this.steer;
			}

			function separateVec(bots) {
				//region variables declaration
					var counter= 0;

					if (!this.awayFromThemVector){
						this.awayFromThemVector = new Vector();
						this.diff = new Vector();
						this.steer = new Vector();
					}else
						this.awayFromThemVector.assign(0,0);
				//end region variables declaration

				for (var i= 0, d; i < bots.length; i++){

					if (isNotTooFar(_loc, bots[i].getLocation(), _separation)){

						d = _loc.getDistanceTo(bots[i].getLocation());

						// if bots[i] is "too close"...
						if ((d > 0) && (d < _separation)){
							//this.diff = "normalized vector pointing from the other bot to this bot"
							this.diff.assign(_loc).sub(bots[i].getLocation()).normalize();
							
							//the closer it is, the more we should flee
							this.diff.div(d);

							this.awayFromThemVector.add(this.diff);

							counter++;
						}
					}
				}

				//if there's at least one bot too close, then...
				if (counter > 0){
					//...calculate the average of all vectors pointing away from close bots
					this.awayFromThemVector.div(counter); 

					this.awayFromThemVector.setNorm(_maxVel);
					
					//steering = desired - velocity 
					this.steer.assign(this.awayFromThemVector).sub(_vel);
					this.steer.limitNorm(_maxSteerForce);

					return this.steer;									
				}

				return Vector.NullVector();
			}

			function cohesionVec(bots, flee) {
				//region variables declaration
					var counter = 0;
					var neighborhood = (!flee)? _neighborhood : 2*_neighborhood;

					if (!this.sumVec){
						this.sumVec = new Vector();
						this.steer = new Vector();
					}else
						this.sumVec.assign(0,0);

				//edn region variables declaration

				//Add up all the velocities and divide by the total to calculate the average velocity
				for (var i= 0, d; i < bots.length; i++){

					if (isNotTooFar(_loc, bots[i].getLocation(), neighborhood)){

						d = _loc.getDistanceTo(bots[i].getLocation());

						// if bots[i] is a "neighbor"...
						if ((d > 0) && (d < neighborhood)){
							this.sumVec.add(bots[i].getLocation());
							counter++;
						}
					}		
				}

				if (counter > 0){
					this.sumVec.div(counter);
					return seekVec(this.sumVec);
				}

				return Vector.NullVector();
			}		

			function fleeVec(badBots) {
				return cohesionVec(badBots, true).inverse().mult(4);
			}
		//end region Private Methods
 	//end region Methods

 	if (!args.$bot)
 		_$parent.append('<div id="bot'+SolidBot.Counter+'" class="'+args.cssClass+'">'+args.html+'</div>');

 	return this;
 }