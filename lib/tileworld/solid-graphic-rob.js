/**
*solid-graphic-rob.js
*<p>
*(description here)
*<p>
*_CL_ stands for CopperLitch
*_CLN_ stands for CopperLitch Node (which in this context will mean "3D Object(s)")
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//Class  GraphicRob
function GraphicRob(CLNode, graphicTileWorld){
	//region Enums
		var ANIMATION = {	None:0, WalkEast:1, WalkWest:2,
							WalkSouth:3, WalkNorth:4, CantDoThat:5,
							TurnWest:6, TurnEast:7, TurnSouth:8,
							TurnNorth:9
						};

		var CL_ANIMATION = {Walk:0, StopWalking:1, CantWhileStanding:2,
							Standing:3, CantWhileWalking:4, WalkPushing:5, StartWalkingPushing:6};

		var KEY_PRESSED = {Left:0, Right:1, Down:2, Up:3};

		var CAMERA_LOCATION = {West:0, East:1, North:2, South:3};
	//end region Enums
	//region Attributes
		//-public:

		//private:
			//-> Internal parameters
			var _WALKSPEED =0.5; //how much does Rob move each frame while he's walking? Max. value = 5(_FloorCellSize/2)
			var _ROTATION_FRAMES = 9; // how many frames does it take Rob to turn around?

			var _WalkCurrentSpeed = _WALKSPEED;
			var _rotationCurrentSpeed = _ROTATION_FRAMES;

			//-> 3D Rob, Rob's Program Agent and Pointer to the 3D world
			var _node = CLNode; //Rob's CopperLicht Node			
			var _gTileworld = graphicTileWorld; //pointer to the graphic TileWorld Rob is in
			if (!_CONTROLLED_BY_HUMAN)
			var _programAgent = new Worker("./lib/tileworld/solid-agent.js");

			var _environment = _gTileworld.Environment;
			var _abstractLevel = _gTileworld.Environment.AbstractLevel;
			var _self = this;

			//-> Animation stuff
			var _targetXZ = new CL3D.Vect2d(0, 0); //what floor cell is Rob going to? [X,Z]
			var _currentAnimation = ANIMATION.None; //what animation is Rob doing?

			//-> Temporal and auxiliary variables:
			//used to compute the Animation of Rob turning
			var _turnAroundCurrentAngle = 0; 
			var _turnAroundFinalAngle;
			var _TurnAroundOffset = 0;

			var _listOfTilesToSlide = _environment.getListOfTilesToSlide();

			//-> To handle user's inputs from the keyboard
			var _KeysPressed = [false, false, false, false]; // [LEFT pressed?, RIGHT pressed?, UP pressed?, DOWN pressed?]
			var _LastKeyPressedIndex = -1; //what was the last key pressed by the user? (-1 none, 0 left, 1 right, 2 up, 3 down)
			var _LastWalkingDirection = null; //pointer to the function that handled the last walking animation

			var _thinking_flag = false;

			//sounds
			if (_AUDIO_ENABLE){
				var _sound_walk = new buzz.sound("./sounds/rob-walk.mp3").loop();
				var _sound_walk_tile = new buzz.sound("./sounds/rob-walk-tile.mp3");//.loop();
				var _sound_cant_walking = new buzz.sound("./sounds/rob-cant-walking.mp3");
			}
	//end region Attributes
	//
	//
	//region Methods
		//region Public Methods
			//region Getters and Setters
				this.getTargetX = function() {return _targetXZ.X;}
				this.getTargetZ = function() {return _targetXZ.Y;}
				this.getCLNode  = function() {return _node;}

				this.setXZ = function(X, Z) {
					_targetXZ.X = _node.Pos.X = X;
					_targetXZ.Y = _node.Pos.Z = Z;
				}
			//end region Getters and Setters
			//
			//region I/O and behavior
				//--------------------------------------------------------------------------------------> leftArrowKeyPressed
				this.leftArrowKeyPressed = function() {if (_CONTROLLED_BY_HUMAN) walk(KEY_PRESSED.Left);}

				//--------------------------------------------------------------------------------------> rightArrowKeyPressed
				this.rightArrowKeyPressed = function() {if (_CONTROLLED_BY_HUMAN) walk(KEY_PRESSED.Right);}

				//--------------------------------------------------------------------------------------> upArrowKeyPressed
				this.upArrowKeyPressed = function() {if (_CONTROLLED_BY_HUMAN) walk(KEY_PRESSED.Up);}

				//--------------------------------------------------------------------------------------> downArrowKeyPressed
				this.downArrowKeyPressed = function() {if (_CONTROLLED_BY_HUMAN) walk(KEY_PRESSED.Down);}
			//end region I/O and behavior


			//this function contains all the code to handle Rob's animation and it's executed each frame
			//by the TileworldGraphic Class
			//------------------------------------------------------------------------------------------> Animate
			this.animate = function() {
				// if Rob has to do something, then...
				if (_currentAnimation != ANIMATION.None){
					//-> Single cases
					switch(_currentAnimation){
						case ANIMATION.WalkEast: //does he have to walk forward?
							Animation_WalkEast();
							break;
						case ANIMATION.WalkWest: //does he have to walk backward?
							Animation_WalkWest();
							break;
						case ANIMATION.WalkSouth: //does he have to walk to his right?
							Animation_WalkSouth();
							break;
						case ANIMATION.WalkNorth: //does he have to walk to his left?
							Animation_WalkNorth();
							break;
						case  ANIMATION.CantDoThat:	//does he have to say "I can't do that" to the user?
							if (_node.getFrameNr() == _node.getNamedAnimationInfo(CL_ANIMATION.CantWhileStanding).End ||
								_node.getFrameNr() == _node.getNamedAnimationInfo(CL_ANIMATION.CantWhileWalking).End)
							{
								_currentAnimation = ANIMATION.None;

								if (!_CONTROLLED_BY_HUMAN)
									RobStartsThinkingAboutNextAction();
							}
							break;
						case ANIMATION.TurnNorth:
							if ( (_turnAroundOffset <= 0 && _turnAroundCurrentAngle <= _turnAroundFinalAngle) ||
								 (_turnAroundOffset >  0 && _turnAroundCurrentAngle >= _turnAroundFinalAngle) )
							{
								_currentAnimation = ANIMATION.None;
								_node.Rot.Y = -90;
								WalkNorth();
							}
							break;
						case ANIMATION.TurnSouth:
							if ( (_turnAroundOffset <= 0 && _turnAroundCurrentAngle <= _turnAroundFinalAngle) ||
								 (_turnAroundOffset >  0 && _turnAroundCurrentAngle >= _turnAroundFinalAngle) )
							{
								_currentAnimation = ANIMATION.None;
								_node.Rot.Y = 90;
								WalkSouth();
							}
							break;
						case ANIMATION.TurnEast:
							if ( (_turnAroundOffset <= 0 && _turnAroundCurrentAngle <= _turnAroundFinalAngle) ||
								 (_turnAroundOffset >  0 && _turnAroundCurrentAngle >= _turnAroundFinalAngle) )
							{
								_currentAnimation = ANIMATION.None;
								_node.Rot.Y = 0;
								WalkEast();
							}
							break;
						case ANIMATION.TurnWest:
							if ( (_turnAroundOffset <= 0 && _turnAroundCurrentAngle <= _turnAroundFinalAngle) ||
								 (_turnAroundOffset >  0 && _turnAroundCurrentAngle >= _turnAroundFinalAngle) )
							{
								_currentAnimation = ANIMATION.None;
								_node.Rot.Y = 180;
								WalkWest();
							}
							break;
					}

					//->Multiple cases
					switch(_currentAnimation){
						//case Rob's turning around
						case ANIMATION.TurnNorth:
						case ANIMATION.TurnSouth:
						case ANIMATION.TurnEast:
						case ANIMATION.TurnWest:
							_turnAroundCurrentAngle+= _turnAroundOffset;
							_node.Rot.Y = to180Degrees(_turnAroundCurrentAngle);
							break;

						//case Rob's walking
						case ANIMATION.WalkEast:
						case ANIMATION.WalkWest:
						case ANIMATION.WalkSouth:
						case ANIMATION.WalkNorth:

							if (parseInt(_node.getFrameNr()) >= (_node.getNamedAnimationInfo(CL_ANIMATION.StartWalkingPushing).End-1)){
								_node.setLoopMode(true);
								_node.setAnimation("walk-pushing");
							}

							//_node.setAnimationSpeed(666.67*_WalkCurrentSpeed /*(400/0.6)*_WalkCurrentSpeed*/);
							break;
					}

					//CL Engine, Rob position has changed and therefore you must redraw him, please!
					//_node.updateAbsolutePosition();
				}else{
					//Rob, if you just finished animating, then...
					if (_isItTheEndOf(CL_ANIMATION.StopWalking,10000) ||
						_isItTheEndOf(CL_ANIMATION.CantWhileStanding) ||
						_isItTheEndOf(CL_ANIMATION.CantWhileWalking)){

						//...Stay where you are and wait for the user to give you orders
						_node.setLoopMode(true);
						_node.setAnimation("stand");

						if (_AUDIO_ENABLE)
							_sound_walk.stop();
					}else
						if (_isItTheEndOf(CL_ANIMATION.Walk, 40000) ||
							_isItTheEndOf(CL_ANIMATION.WalkPushing, 40000) ||
							isCurrentAimation(CL_ANIMATION.StartWalkingPushing)){
							_node.setLoopMode(false);
							_node.setAnimation("stop");
					}
				}
			}

			//every second auto calculate _WalkCurrentSpeed and _rotationCurrentSpeed according to user's PC performance
			this.autoCalculateSpeed = function(currentFPS){
					_WalkCurrentSpeed = _WALKSPEED*(_FPS/currentFPS);
					_rotationCurrentSpeed = Math.ceil(_ROTATION_FRAMES/(_FPS/currentFPS));

					if (_WalkCurrentSpeed > 5) //5 = _FloorCellSize/2
						_WalkCurrentSpeed = 5;
			}

			this.setMinimalUpdateDelay = function(frames){ _node.setMinimalUpdateDelay(frames); }
		//end region Public Methods
		//
		//region Private
			//used to receive the Rob's Program Agent action
			//-----------------------------------------------------------------------------------------> RobStopsThinking
			function RobStopsThinking(action) {
				_thinking_flag = false;

				switch (action.data){
					case _ACTION.SOUTH:
						WalkSouth();
						break;
					case _ACTION.NORTH:
						WalkNorth();
						break;
					case _ACTION.EAST:
						WalkEast();
						break;
					case _ACTION.WEST:
						WalkWest();
						break;
					case _ACTION.NONE:
					default:
				}
				//RobStartsThinkingAboutNextAction();
			}

			//Used to call Rob's Program Agent in order to get the next action to do
			//-----------------------------------------------------------------------------------------> RobStartsThinkingAboutNextAction
			function RobStartsThinkingAboutNextAction(){
				var robLocation = _environment.getRobLocation();
				//call the Rob's Program Agent
				_programAgent.postMessage( _abstractLevel.perceptionFunction(_environment) /*total o parcial 2 -> 2+r+2 x 2+r+2*/);
			}

			//-----------------------------------------------------------------------------------------> fillHoleIfSo
			function fillHoleIfSo(){
				if (_environment.isThereAHoleToFill())
					_gTileworld.fillHole(_environment.getHoleToFill());
			}

			//-----------------------------------------------------------------------------------------> _isItTheEndOf
			function _isItTheEndOf(animationIndex, offset){
				offset = offset || 1000;

				return	_node.getFrameNr() >= _node.getNamedAnimationInfo(animationIndex).End-offset && 
						_node.getFrameNr() <= _node.getNamedAnimationInfo(animationIndex).End;
			}

			//-----------------------------------------------------------------------------------------> isCurrentAimation
			function isCurrentAimation(index){
				return (_node.getNamedAnimationInfo(index).Begin <= _node.getFrameNr() &&
						_node.getFrameNr() <= _node.getNamedAnimationInfo(index).End);
			}

			//-----------------------------------------------------------------------------------------> getWalkingCaseAccordingToCameraLocation
			function getWalkingCaseAccordingToCameraLocation(){
				var activeCameraAngle = to360Degrees(CL3D.radToDeg(Math.atan2(_gTileworld.getActiveCamera().Pos.X- _node.Pos.X, _gTileworld.getActiveCamera().Pos.Z - _node.Pos.Z)));

				if (activeCameraAngle >= 45 && activeCameraAngle < 135)
					return CAMERA_LOCATION.West; //Camera is west of Rob
				else
					if (activeCameraAngle >= 135 && activeCameraAngle < 225)
						return CAMERA_LOCATION.South; //Camera is south of Rob
					else
						if (activeCameraAngle >= 225 && activeCameraAngle < 315)
							return CAMERA_LOCATION.East; //Camera is east of Rob
						else
							return CAMERA_LOCATION.North; //Camera is north of Rob
			}

			//-----------------------------------------------------------------------------------------> rearrangeTileNodesOnTheFloorMatrix
			function rearrangeTileNodesOnTheFloorMatrix(theCase){
				if (_listOfTilesToSlide.empty()) return;

				var xSlide = 0, ySlide = 0;
				var nodesOnTheFloor = _gTileworld.getOnTheFloorMatrix();

				switch(theCase){
					case ANIMATION.WalkNorth: //slide to the left
						xSlide = -1;
						break;
					case ANIMATION.WalkSouth: //slide to the right
						xSlide = 1;
						break;
					case ANIMATION.WalkEast: //slide forward
						ySlide = 1;
						break;
					case ANIMATION.WalkWest: //slide backward
						ySlide = -1;
				}

				for (var i= _listOfTilesToSlide.getLength()-1, tile; i >= 0 ; i--) {
					tile = _listOfTilesToSlide.getItemAt(i);

					nodesOnTheFloor[tile[0]][tile[1]] =  nodesOnTheFloor[tile[0]-xSlide][tile[1]-ySlide];
					nodesOnTheFloor[tile[0]-xSlide][tile[1]-ySlide] = null;
				}
			}

			//region behavior
				//--------------------------------------------------------------------------------------> Walk
				function walk(keyPressedCase){
					if (_currentAnimation == ANIMATION.None){
						switch(getWalkingCaseAccordingToCameraLocation()){
							case CAMERA_LOCATION.West: //Camera is west of Rob
								switch(keyPressedCase){
									case KEY_PRESSED.Left:
										WalkWest();
										break;
									case KEY_PRESSED.Right:
										WalkEast();
										break;
									case KEY_PRESSED.Up:
										WalkNorth();
										break;
									case KEY_PRESSED.Down:
										WalkSouth();
										break;
								}
								break;
							case CAMERA_LOCATION.South: //Camera is south of Rob
								switch(keyPressedCase){
									case KEY_PRESSED.Left:
										WalkNorth();
										break;
									case KEY_PRESSED.Right:
										WalkSouth();
										break;
									case KEY_PRESSED.Up:
										WalkEast();
										break;
									case KEY_PRESSED.Down:
										WalkWest();
										break;
								}
								break;
							case CAMERA_LOCATION.East: //Camera is east of Rob
								switch(keyPressedCase){
									case KEY_PRESSED.Left:
										WalkEast();
										break;
									case KEY_PRESSED.Right:
										WalkWest();
										break;
									case KEY_PRESSED.Up:
										WalkSouth();
										break;
									case KEY_PRESSED.Down:
										WalkNorth();
										break;
								}
								break;
							case CAMERA_LOCATION.North: //Camera is north of Rob
								switch(keyPressedCase){
									case KEY_PRESSED.Left:
										WalkSouth();
										break;
									case KEY_PRESSED.Right:
										WalkNorth();
										break;
									case KEY_PRESSED.Up:
										WalkWest();
										break;
									case KEY_PRESSED.Down:
										WalkEast();
										break;
								}
								break;
						}
					}
				}

				//--------------------------------------------------------------------------------------> WalkNorth
				function WalkNorth(){
					var robLocation, iRow, tilesToSlide;

					if (_currentAnimation == ANIMATION.None){

						if (_AUDIO_ENABLE)
							_sound_walk.play();

						_LastWalkingDirection = WalkNorth;

						//if Rob's currently looking to South...
						if (_node.Rot.Y	== -90){
							robLocation = _environment.getRobLocation(); //environment (row, column) pair

							if (_environment.slideTiles(_ACTION.NORTH))
								rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkNorth);

							//if Rob's can move to South (that is, there's no holes or obstacles)
							if (_targetXZ.X > _gTileworld.getFloorLimits().X0 && _environment.isItAnEmptyCell(robLocation.Row-1, robLocation.Column)){

								if (!_environment.isItAObstacle(robLocation.Row-1, robLocation.Column)){

									_targetXZ.X -= _gTileworld.getFloorCellSize();
									_environment.robWalkingToNorth();

									_currentAnimation = ANIMATION.WalkNorth;
									Animation_Walk();
								}else
									/*Animation_cannotDoThatSlideing();*/Animation_cannotDoThat();
							}else
								Animation_cannotDoThat();
						}else{
							turnAroundUntilDegrees(270);
							_currentAnimation = ANIMATION.TurnNorth;
						}
					}
				}

				//--------------------------------------------------------------------------------------> WalkSouth
				function WalkSouth(){
					var robLocation, iRow;

					if (_currentAnimation == ANIMATION.None){

						if (_AUDIO_ENABLE)
							_sound_walk.play();

						_LastWalkingDirection = WalkSouth;

						//if Rob's currently looking to North...
						if (_node.Rot.Y	== 90){
							robLocation = _environment.getRobLocation();

							if (_environment.slideTiles(_ACTION.SOUTH))
								rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkSouth);

							//if Rob's can move to North (that is, there's no holes or obstacles)
							if (_targetXZ.X < _gTileworld.getFloorLimits().X1 && _environment.isItAnEmptyCell(robLocation.Row+1, robLocation.Column)) {

								if (!_environment.isItAObstacle(iRow, robLocation.Column)){

									_targetXZ.X += _gTileworld.getFloorCellSize();
									_environment.robWalkingToSouth();

									_currentAnimation = ANIMATION.WalkSouth;
									Animation_Walk();
								}else
									/*Animation_cannotDoThatSlideing();*/Animation_cannotDoThat();
							}else
								Animation_cannotDoThat();
						}else{
							turnAroundUntilDegrees(90);
							_currentAnimation = ANIMATION.TurnSouth;
						}
					}
				}

				//--------------------------------------------------------------------------------------> WalkEast
				function WalkEast(){
					var robLocation, iColumn;

					if (_currentAnimation == ANIMATION.None){

						if (_AUDIO_ENABLE)
							_sound_walk.play();

						_LastWalkingDirection = WalkEast;

						//if Rob's currently looking East...
						if (_node.Rot.Y	== 0){
							robLocation = _environment.getRobLocation();

							if (_environment.slideTiles(_ACTION.EAST))
								rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkEast);

							//if Rob's can move to East (that is, there's no holes or obstacles)
							if (_targetXZ.Y < _gTileworld.getFloorLimits().Y1 && _environment.isItAnEmptyCell(robLocation.Row, robLocation.Column+1)) {
								if (!_environment.isItAObstacle(robLocation.Row, iColumn)){

									_targetXZ.Y += _gTileworld.getFloorCellSize();
									_environment.robWalkingToEast();

									_currentAnimation = ANIMATION.WalkEast;
									Animation_Walk();
								}else
									/*Animation_cannotDoThatSlideing();*/Animation_cannotDoThat();
							}else
								Animation_cannotDoThat();
						}else{
							turnAroundUntilDegrees(0);
							_currentAnimation = ANIMATION.TurnEast;
						}
					}
				}

				//--------------------------------------------------------------------------------------> WalkWest
				function WalkWest(){
					var robLocation, iColumn;

					if (_currentAnimation == ANIMATION.None){

						if (_AUDIO_ENABLE)
							_sound_walk.play();

						_LastWalkingDirection = WalkWest;

						//if Rob's currently looking West...
						if (_node.Rot.Y	== 180){
							robLocation = _environment.getRobLocation();

							if (_environment.slideTiles(_ACTION.WEST))
								rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkWest);

							//if Rob's can move to West (that is, there's no holes or obstacles)
							if (_targetXZ.Y  > _gTileworld.getFloorLimits().Y0 && _environment.isItAnEmptyCell(robLocation.Row, robLocation.Column-1))
							{
								if (!_environment.isItAObstacle(robLocation.Row, iColumn)){

									_targetXZ.Y -= _gTileworld.getFloorCellSize();
									_environment.robWalkingToWest();

									_currentAnimation = ANIMATION.WalkWest;
									Animation_Walk();
								}else
									/*Animation_cannotDoThatSlideing();*/Animation_cannotDoThat();
							}else
								Animation_cannotDoThat();
						}else{
							turnAroundUntilDegrees(180);
							_currentAnimation = ANIMATION.TurnWest;
						}
					}
				}
			//end region behavior
			//
			//region Animation Functions
				//--------------------------------------------------------------------------------------> Animation_cannotDoThat
				function Animation_cannotDoThat(){
					var _currentWalkAnimationFrame = _node.getFrameNr();

					_node.setLoopMode(false);

					if (isCurrentAimation(CL_ANIMATION.Walk)){

						if (_AUDIO_ENABLE){
							_sound_walk.stop();
							_sound_cant_walking.play();
						}

						_node.setAnimation('cant_while_walking');
						//Start the animation at the same legs motion time
						_node.setCurrentFrame(
							_node.getNamedAnimationInfo(CL_ANIMATION.CantWhileWalking).Begin +
							((_currentWalkAnimationFrame < 74587)? 
								((_currentWalkAnimationFrame <= 40022)? _currentWalkAnimationFrame : 40022)
							:
								((_currentWalkAnimationFrame <= 129163)? _currentWalkAnimationFrame - 74587 : 40022))
						);
					}else{
						_node.setCurrentFrame(_node.getNamedAnimationInfo(CL_ANIMATION.CantWhileStanding).Begin);
						_node.setAnimation("cant");
					}

					_currentAnimation = ANIMATION.CantDoThat;
				}

				//--------------------------------------------------------------------------------------> Animation_Walk
				function Animation_Walk(){
					if (_listOfTilesToSlide.empty()){
						if (!isCurrentAimation(CL_ANIMATION.Walk)){
							_node.setLoopMode(true);
							_node.setAnimation("walk");

							_node.setCurrentFrame(_node.getNamedAnimationInfo(CL_ANIMATION.Walk).End - 130000/*85000*/);
						}
					}else{
						if (!isCurrentAimation(CL_ANIMATION.WalkPushing) && !isCurrentAimation(CL_ANIMATION.StartWalkingPushing)) 
						{
							_node.setLoopMode(false);
							_node.setAnimation("start-walking-pushing");

							if (_AUDIO_ENABLE)
								_sound_walk_tile.play();
						}

					}
				}

				//--------------------------------------------------------------------------------------> Animation_stopWalking
				function Animation_stopWalking(){
					this.lastCase;

					if (!_listOfTilesToSlide.empty()){
						nodesOnTheFloor = _gTileworld.getOnTheFloorMatrix();
						for (var i= 0, tileCoordinates, nodesOnTheFloor; i < _listOfTilesToSlide.getLength(); i++){
							tileCoordinates = _listOfTilesToSlide.getItemAt(i);
							nodesOnTheFloor[tileCoordinates[0]][tileCoordinates[1]].Pos.X = GraphicTileworld.RowIndexToXPosition(tileCoordinates[0]);
							nodesOnTheFloor[tileCoordinates[0]][tileCoordinates[1]].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(tileCoordinates[1]);
						}
					}

					_environment.robGetLocation();
					_currentAnimation = ANIMATION.None;

					if (!_CONTROLLED_BY_HUMAN){
						_thinking_flag = true;
						//Animation_StopWalking_End();
						//now that you just stop walking, you're ready for starting to think about the new action to do
						RobStartsThinkingAboutNextAction();
					}else{
						//if User's pressed a key while Rob started moving from the previous location...
						//...what was that key user has pressed?
						switch (_LastKeyPressedIndex){
							case 0://is it the left arrow key?
								if (_LastWalkingDirection && this.lastCase == 0)
									_LastWalkingDirection.call();
								else
									_self.leftArrowKeyPressed(); 
								break;
							case 1://is it the right arrow key?
								if (_LastWalkingDirection && this.lastCase == 1)
									_LastWalkingDirection.call();
								else
									_self.rightArrowKeyPressed();
								break;
							case 2://is it the up arrow key?
								if (_LastWalkingDirection && this.lastCase == 2)
									_LastWalkingDirection.call();
								else
									_self.upArrowKeyPressed();
								break;
							case 3://is it the down arrow key?
								if (_LastWalkingDirection && this.lastCase == 3)
									_LastWalkingDirection.call();
								else
									_self.downArrowKeyPressed();
								break;
							default://if user hasn't pressed any key, is the user already holding one of them?
								//case user's holding the left arrow key
								if (_KeysPressed[0]) _self.leftArrowKeyPressed();
								else
									//case user's holding the right arrow key
									if (_KeysPressed[1]) _self.rightArrowKeyPressed();
									else
										//case user's holding the up arrow key
										if (_KeysPressed[2]) _self.upArrowKeyPressed();
										else
											//case user's holding the down arrow key
											if (_KeysPressed[3]) _self.downArrowKeyPressed();
											 //if the user isn't holding any key, then...
											else{
												//Rob, you must stop walking
												Animation_StopWalking_End();
											}
						}
						this.lastCase = _LastKeyPressedIndex;
					}
				}

				//--------------------------------------------------------------------------------------> Animation_StopWalking_End
				function Animation_StopWalking_End(){
					var getFrameNrCache = _node.getFrameNr();
					_node.Pos.X = _self.getTargetX();
					_node.Pos.Z = _self.getTargetZ();
					_node.setLoopMode(false);
					_node.setAnimation('stop');

					//Start the stop animation at the same legs position
					_node.setCurrentFrame(
						_node.getNamedAnimationInfo(CL_ANIMATION.StopWalking).Begin +
						((getFrameNrCache < 74587)? 
							((getFrameNrCache <= 40022)? getFrameNrCache : 40022)
						:
							((getFrameNrCache <= 129163)? getFrameNrCache - 74587 : 40022))
					);
				}

				//--------------------------------------------------------------------------------------> Animation_WalkNorth
				function Animation_WalkNorth(){
					if (_node.Pos.X > _self.getTargetX()){

						for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
							tileCoordinates = _listOfTilesToSlide.getItemAt(i);
							CL_Tile = _gTileworld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
							if (CL_Tile)
								CL_Tile.Pos.X-=_WalkCurrentSpeed;
						}

						if (_node.Pos.X - _self.getTargetX() < 6)
							fillHoleIfSo();

						_node.Pos.X-=_WalkCurrentSpeed;
					}else
						if (_environment.isThereAHoleFilling()){
							Animation_WaitingForHoleToBeFilled();
						}else
							Animation_stopWalking();
				}

				//--------------------------------------------------------------------------------------> Animation_WalkSouth
				function Animation_WalkSouth(){
					if (_node.Pos.X < _self.getTargetX()){
						for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
							tileCoordinates = _listOfTilesToSlide.getItemAt(i);
							CL_Tile = _gTileworld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
							if (CL_Tile)
								CL_Tile.Pos.X+=_WalkCurrentSpeed;
						}

						if (_self.getTargetX() - _node.Pos.X < 6)
							fillHoleIfSo();

						_node.Pos.X+=_WalkCurrentSpeed;
					}else
						if (_environment.isThereAHoleFilling()){
							Animation_WaitingForHoleToBeFilled();
						}else
							Animation_stopWalking();
				}

				//--------------------------------------------------------------------------------------> Animation_WalkEast
				function Animation_WalkEast(){
					if (_node.Pos.Z < _self.getTargetZ()){
						for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
							tileCoordinates = _listOfTilesToSlide.getItemAt(i);
							CL_Tile = _gTileworld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
							if (CL_Tile)
								CL_Tile.Pos.Z+=_WalkCurrentSpeed;
						}

						if (_self.getTargetZ() - _node.Pos.Z < 6)
							fillHoleIfSo();

						_node.Pos.Z+=_WalkCurrentSpeed;
					}else
						if (_environment.isThereAHoleFilling()){
							Animation_WaitingForHoleToBeFilled();
						}else
							Animation_stopWalking();
				}

				//--------------------------------------------------------------------------------------> Animation_WalkWest
				function Animation_WalkWest(){
					if (_node.Pos.Z > _self.getTargetZ()){
						for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
							tileCoordinates = _listOfTilesToSlide.getItemAt(i);

							CL_Tile = _gTileworld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);

							if (CL_Tile)
								CL_Tile.Pos.Z-=_WalkCurrentSpeed;
						}

						if (_node.Pos.Z - _self.getTargetZ() < 6)
							fillHoleIfSo();

						_node.Pos.Z-=_WalkCurrentSpeed;
					}else
						if (_environment.isThereAHoleFilling()){
							Animation_WaitingForHoleToBeFilled();
						}else
							Animation_stopWalking();
				}

				//--------------------------------------------------------------------------------------> Animation_WaitingForHoleToBeFilled
				function Animation_WaitingForHoleToBeFilled() {
					//TODO: hacer animacion parado con las manos en la tile esperando que caiga la pieza al hueco (igual tengo problemas, como que al moverse no cambia la animacion y se mueve "duro")
					//_node.setFrameLoop(1976534, 1976534);
					_node.setLoopMode(false);
					_node.setAnimation('stop');
				}

				//--------------------------------------------------------------------------------------> turnAroundUntilDegrees
				function turnAroundUntilDegrees(finalDegrees){
					//where is Rob looking at?
					_turnAroundCurrentAngle = to360Degrees(_node.Rot.Y);
					//taking into account where Rob's looking at, how many degrees should Rob turn around?
					_turnAroundFinalAngle = finalDegrees - _turnAroundCurrentAngle;

					//Rob! don't turn more than 180º, there's another shorter way, for instance, turning more than 180º to your left could be achieved turning to 
					//your right a less amount of degrees! an example of this would be, turning 270º to your left is the same as turning 90º to your right
					_turnAroundFinalAngle = (_turnAroundFinalAngle < -180)?
												_turnAroundFinalAngle + 360
												:
												(_turnAroundFinalAngle > 180)?
														_turnAroundFinalAngle - 360
														:
														_turnAroundFinalAngle;

					//how many degrees Rob's gonna turn each frame of the turning animation
					_turnAroundOffset = _turnAroundFinalAngle/_rotationCurrentSpeed;

					_turnAroundFinalAngle = _turnAroundCurrentAngle + _turnAroundFinalAngle;

				}
			//end region Animation Functions
		//end region Private Methods
	//end region Methods
	//
	//region Constructor Logic --------------------------------------------------------------> Constructor Begin

		//region User Input Handler
			//-> keyDown Event Handler
			$(document).keydown(function(e){
				if (isValidKey(e.keyCode)){
					switch(e.keyCode){
						case 37://left arrow key
						case 65://A key
							_LastKeyPressedIndex = 0;
							_self.leftArrowKeyPressed();
							break;
						case 39://right arrow key
						case 68://D key
							_LastKeyPressedIndex = 1;
							_self.rightArrowKeyPressed();
							break;
						case 38://up arrow key
						case 87://W key
							_LastKeyPressedIndex = 2;
							_self.upArrowKeyPressed();
							break;
						case 40://down arrow key
						case 83://S key
							_LastKeyPressedIndex = 3;
							_self.downArrowKeyPressed();
							break;
					}
					_KeysPressed[_LastKeyPressedIndex] = true;
				}
			});

			//-> keyUp Event Handler
			$(document).keyup(function(e){
				if (isValidKey(e.keyCode)){
					_LastKeyPressedIndex = -1;
					_LastWalkingDirection = null;

					switch (e.keyCode){
						case 37://left key
						case 65://A key
							_KeysPressed[0] = false;
							break;
						case 39://right key
						case 68://D key
							_KeysPressed[1] = false;
							break;
						case 38://up key
						case 87://W key
							_KeysPressed[2] = false;
							break;
						case 40://down key
						case 83://S key
							_KeysPressed[3] = false;
							break;
					}
				}
			});
		//end region User Input Handler

		_node.Rot.Y = -180;

		if (_WalkCurrentSpeed > 5 || _WALKSPEED > 5) //5 = _FloorCellSize/2
			_WALKSPEED = _WalkCurrentSpeed = 5;

		if (!_CONTROLLED_BY_HUMAN){
			_programAgent.onmessage = RobStopsThinking; //when it returns an action call "RobStopsThinking()"
			RobStartsThinkingAboutNextAction(); //Rob, let's start performing!
		}
	//end region Constructor Logic --------------------------------------------------------------> Constructor End
}