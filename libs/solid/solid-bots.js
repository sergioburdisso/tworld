/*
 *Author: 	Burdisso Sergio
 *
 *Review: 	this file contains a Bots class which user can use for implementing a collection of 
 * 			autonomous agents grouped by a certain intelligent behavior (such as flock) based upon individual
 *			steering behaviors
 */

 function SolidBots(args) {
 	//region Arguments default value mapping
		args = $.extend(
		{
			idDOMParent 	: "body",
			bots: [],
			rotationEnabled : true,
			numberOfBots	: 20,
			numberOfBadBots : 0,
			borderType 		: SolidBot.BorderType.Solid,
			maxVelocity 	: 2
		},  args);

		if (args.$bots){
			var html = args.$bots.html().split("");
	        var _bots = new Array(html.length);
	        args.$bots.html("")
	        for (var $bot, i=0; i < html.length; ++i){
	            $bot = $('<span style="color:gray;" class="animate-zoom-loop">'+html[i]+'</span>');
	            args.$bots.append($bot);

	            _bots[i] = {
	                $bot : $bot,
	                idDOMParent : args.idDOMParent,
	                borderType : SolidBot.BorderType.Infinite,
	                rotate: false,
	                maxVelocity : 4,
	                location: new Vector(),
	                velocity:new Vector(0,-1)
	            };
	        }
			for (var $bot, i=0; i < html.length; ++i){
	            _bots[i].location.x = _bots[i].$bot.offset().left;
	            _bots[i].location.y = _bots[i].$bot.offset().top;
	        }
	        args.bots = _bots;
		}
	//end region Arguments default value mapping
	//
 	//region Attributes
 		//private:
	 	var _bots = args.bots.length > 0? new Array(args.bots.length) : new Array(args.numberOfBots);

	 	var _badBots = new Array(args.numberOfBadBots);
 	//end region Attributes
 	//
 	//region Methods
 		//pulic:
 		//region behavior methods
	 		this.display = function() {
				for (var i= 0; i < _bots.length; i++){
	 				_bots[i].display();
	 			}

	 			for (var i= 0; i < _badBots.length; i++){
	 				_badBots[i].wander();
	 				_badBots[i].separate(_badBots);
	 				_badBots[i].display();
	 			}
			}

			this.seek = function(targetVec) {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].seek(targetVec);
			}

			this.arrive = function(targetVec) {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].arrive(targetVec);
			}

			this.wander = function() {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].wander();
			}

			this.stayThere = function() {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].stayThere();
			}

			this.stayThereAndFleeFrom = function(location) {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].stayThereAndFleeFrom(location, _bots);
			}

			this.separate = function() {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].separate(_bots);
			}

			this.cohesion = function() {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].cohesion(_bots);
			}

			this.seekAndSeparate = function(targetVec) {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].seekAndSeparate(targetVec, _bots);
			}

			this.flock = function() {
				for (var i= 0; i < _bots.length; i++)
	 				_bots[i].flock(_bots);
			}

			this.flockAndFlee = function(fleeBots){
				for (var i= 0; i < _bots.length; i++){
	 				_bots[i].flock(_bots);
	 				_bots[i].flee(fleeBots? fleeBots : _badBots);
	 			}
			}
		//end region behavior methods

		this.add = function(newBot) {
			_bots[_bots.length] = newBot;
		}
 	//end region Methods
 	//
 	//region Contructor Logic
	 	if (!args.bots.length){
	 		for (var i= 0; i < _bots.length; i++){
	 			_bots[i] = new SolidBot({
	 				idDOMParent : args.idDOMParent,
	 				rotate 		: args.rotationEnabled,
	 				maxVelocity : args.maxVelocity,	
	 				borderType 	: args.borderType,
	 				location 	: new Vector(
				 					Math.random()*$(args.idDOMParent).width(),
				 					Math.random()*$(args.idDOMParent).height()
								)				
	 			});
	 			_bots[i].display();
	 		}
	 	}else{
	 		for (var i= 0; i < _bots.length; i++){
	 			_bots[i] = new SolidBot(args.bots[i]);
	 			_bots[i].display();
	 		}
	 	}
 		for (var i= 0; i < _badBots.length; i++){
 			_badBots[i] = new SolidBot({
			 				idDOMParent	: args.idDOMParent,
			 				cssClass 	: "badBots",
			 				rotate 		: args.rotationEnabled,
			 				borderType 	: args.borderType,
							maxVelocity : 1.5,
							location 	: new Vector(
						 					Math.random()*$(args.idDOMParent).width(),
						 					Math.random()*$(args.idDOMParent).height()
										)
			 			});
 			_badBots[i].display();
 		}
 	//end region Contructor Logic
 	return this;
 }