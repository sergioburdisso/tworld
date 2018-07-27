/*
* solid-graphic-rob.js - 
*
* Copyright (C) 2014 Burdisso Sergio (sergio.burdisso@gmail.com)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

//Class  GraphicRob
function GraphicRob(CLNode, graphicTileWorld, index){
  //region Enums
    var ANIMATION = { None:0, WalkEast:1, WalkWest:2, WalkSouth:3, WalkNorth:4, CantDoThat:5 };

    var CL_ANIMATION =  {
              Walk:0, StopWalking:1, CantWhileStanding:2,
              Standing:3, CantWhileWalking:4, WalkPushing:5, StartWalkingPushing:6
              };

    var KEY_PRESSED = {Left:0, Right:1, Down:2, Up:3};

    var CAMERA_LOCATION = {West:0, East:1, North:2, South:3};
  //end region Enums
  //region Attributes
    //private:
      //-> 3D Rob and Pointer to the 3D world
      var _node = CLNode; // Rob's CopperLicht Node
      var _gTWorld = graphicTileWorld; // pointer to the graphic TileWorld Rob is in

      var _index = index;
      var _self = this;
      var _environment = _gTWorld.Environment;
      var _listOfTilesToSlide = _environment.getListOfTilesToSlide(_index);
      var _textureManager = _gTWorld.getCLEngine().getTextureManager();

      //-> Animation stuff
      var _targetXZ = new CL3D.Vect2d(0, 0); // what floor cell is Rob going to? [X,Z]
      var _currentAnimation = ANIMATION.None; // what animation is Rob doing?
      var _startTimeStamp;
      var _startLoc;

      //-> Temporal and auxiliary variables:
      //used to compute the Animation of Rob turning
      var _turnAroundFlag = false;
      var _turnAroundStartAngle;
      var _turnAroundOffsetAngle = 0;
      var _turnAroundFinalAngle;
      var _startRotationTimeStamp;

      //-> To handle user's inputs from the keyboard
      var _KeysPressed = [false, false, false, false]; // [LEFT pressed?, RIGHT pressed?, UP pressed?, DOWN pressed?]
      var _LastKeyPressedIndex = -1; //what was the last key pressed by the user? (-1 none, 0 left, 1 right, 2 up, 3 down)
      var _prevLastKeyPressedIndex = -1;
      var _LastWalkingDirection = null; //pointer to the function that handled the last walking animation

      var _tmp;

      //sounds
      if (_AUDIO_ENABLE){
        _tmp = "./sounds/voices/"+_LANGUAGE.toLowerCase();

        var _sound_walk = new buzz.sound("./sounds/rob-walk.mp3").loop();
        var _sound_walk_tile = new buzz.sound("./sounds/rob-walk-tile.mp3");
        var _sound_battery_restore  = new buzz.sound("./sounds/battery-restore.mp3");

        var _sound_voice_cant_walking = [
          new buzz.sound(_tmp+"/voice_rob-cant-walking0.mp3"),
          new buzz.sound(_tmp+"/voice_rob-cant-walking1.mp3"),
          new buzz.sound(_tmp+"/voice_rob-cant-walking2.mp3")
        ];
        var _sound_voice_cant = [
          new buzz.sound(_tmp+"/voice_rob-cant0.mp3"),
          new buzz.sound(_tmp+"/voice_rob-cant1.mp3"),//ah ah
          new buzz.sound(_tmp+"/voice_rob-cant2.mp3")
        ];
        _sound_voice_cant.prob = [100,800,100];
      }
  //end region Attributes
  //
  //
  //region Methods
    //region Public Methods
      //region Getters and Setters
        this.getTargetX = function() {return _targetXZ.X}
        this.getTargetZ = function() {return _targetXZ.Y}
        this.getCLNode  = function() {return _node}
        this.setXZ = function(X, Z) {
          _targetXZ.X = _node.Pos.X = X;
          _targetXZ.Y = _node.Pos.Z = Z
        }
        this.isWalking = function(){return isCurrentAimation(CL_ANIMATION.Walk) || isCurrentAimation(CL_ANIMATION.WalkPushing)}
      //end region Getters and Setters
      //
      //region I/O and behavior
        //--------------------------------------------------------------------------------------> leftArrowKeyPressed
        this.leftArrowKeyPressed = function(lastKey) {
          if (lastKey){
            if (_prevLastKeyPressedIndex == -1)
              _prevLastKeyPressedIndex = 0;
            _KeysPressed[0] = true;
          }

          _LastKeyPressedIndex = 0;

          walk(KEY_PRESSED.Left);
        }

        //--------------------------------------------------------------------------------------> rightArrowKeyPressed
        this.rightArrowKeyPressed = function(lastKey) {
          if (lastKey){
            if (_prevLastKeyPressedIndex == -1)
              _prevLastKeyPressedIndex = 1;
            _KeysPressed[1] = true;
          }

          _LastKeyPressedIndex = 1;

          walk(KEY_PRESSED.Right);
        }

        //--------------------------------------------------------------------------------------> upArrowKeyPressed
        this.upArrowKeyPressed = function(lastKey) {
          if (lastKey){
            if (_prevLastKeyPressedIndex == -1)
              _prevLastKeyPressedIndex = 2;
            _KeysPressed[2] = true;
          }

          _LastKeyPressedIndex = 2;

          walk(KEY_PRESSED.Up);
        }

        //--------------------------------------------------------------------------------------> downArrowKeyPressed
        this.downArrowKeyPressed = function(lastKey) {
          if (lastKey){
            if (_prevLastKeyPressedIndex == -1)
              _prevLastKeyPressedIndex = 3;
            _KeysPressed[3] = true;
          }

          _LastKeyPressedIndex = 3;

          walk(KEY_PRESSED.Down);
        }
        //--------------------------------------------------------------------------------------> keyUp
        this.keyUp = function(iKey){
          _LastKeyPressedIndex = -1;
          _LastWalkingDirection = null;
          _KeysPressed[iKey] = false;
        }

        //--------------------------------------------------------------------------------------> restoreBattery
        this.restoreBattery = function(noStats){
          if ( (_Running && !_Paused) && !_environment.isBatteryChargeSufficient(_index)){
            if (_index == _GET_TEAM_LEADER(_index)){
              if (_AUDIO_ENABLE) _sound_battery_restore.setPercent(0).play();

              if (!noStats)
                _environment.updateStats(_index, 0/*Battery_Restore*/);

              _environment.updateBattery(_index, 1000, 2/*restoration flag*/);
              _environment.updateScore(_index);
            }else
              _gTWorld.restoreBattery(_GET_TEAM_LEADER(_index), true);
          }
        }
      //end region I/O and behavior

      //this function contains all the code to handle Rob's animation and it's executed each frame
      //by the TWorldGraphic Class
      //------------------------------------------------------------------------------------------> Animate
      this.animate = function(timeElapsed) {
        // if Rob has to do something, then...
        if (_currentAnimation != ANIMATION.None){
          //-> Single cases
          switch(_currentAnimation){
            case ANIMATION.WalkEast: //does he have to walk forward?
              Animation_WalkEast(timeElapsed);
              break;
            case ANIMATION.WalkWest: //does he have to walk backward?
              Animation_WalkWest(timeElapsed);
              break;
            case ANIMATION.WalkSouth: //does he have to walk to his right?
              Animation_WalkSouth(timeElapsed);
              break;
            case ANIMATION.WalkNorth: //does he have to walk to his left?
              Animation_WalkNorth(timeElapsed);
              break;
            case  ANIMATION.CantDoThat: //does he have to say "I can't do that" to the user?
              if (_isTheEndOf(CL_ANIMATION.CantWhileStanding, 10000)||
                _isTheEndOf(CL_ANIMATION.CantWhileWalking, 20000))
              {
                _currentAnimation = ANIMATION.None;
                nextMovementIfNecessary();
              }
              if (_ACTIVE_CAMERA == _CAMERA_TYPE.FIRST_PERSON && _turnAroundFlag && isCurrentAimation(CL_ANIMATION.CantWhileStanding))
                _turnAroundFlag = false;
              break;
          }

          //case Rob's turning around
          if (_turnAroundFlag){
            _tmp = (_startRotationTimeStamp+=timeElapsed)/_ROB_ROTATION_TIME;
            if ( _tmp >= 1 )
            {
              _node.Rot.Y = to180Degrees(_turnAroundStartAngle + _turnAroundFinalAngle);
              _turnAroundFlag = false;
            }else{
              _turnAroundOffsetAngle= _turnAroundFinalAngle*_tmp;
              _node.Rot.Y = to180Degrees(_turnAroundStartAngle + _turnAroundOffsetAngle);
            }
          }

          //->Multiple cases
          switch(_currentAnimation){
            //case Rob's walking
            case ANIMATION.WalkEast:
            case ANIMATION.WalkWest:
            case ANIMATION.WalkSouth:
            case ANIMATION.WalkNorth:

              if (parseInt(_node.getFrameNr()) >= (_node.getNamedAnimationInfo(CL_ANIMATION.StartWalkingPushing).End-1)){
                _node.setLoopMode(true);
                _node.setAnimation("walk-pushing");
              }
              break;
          }
        }else{
          //Rob, if you just finished animating, then...

          if (_isTheEndOf(CL_ANIMATION.StopWalking, 10000) ||
            _isTheEndOf(CL_ANIMATION.CantWhileStanding) ||
            _isTheEndOf(CL_ANIMATION.CantWhileWalking)){
            //...Stay where you are and wait for the user to give you orders

            if (!_environment.isBatteryChargeSufficient(_index)){
              // Insufficient battery charge!!
              Animation_outOfBattery();
            }else{
              _node.setLoopMode(true);
              _node.setAnimation("stand");
              _node.setAnimationSpeed(((Math.random() < 0.5)? 1:-1)*(200 + random(-100,100)));
            }

            if (_AUDIO_ENABLE)
              _sound_walk.stop();
          }else
            if (_isTheEndOf(CL_ANIMATION.Walk, 40000) ||
              _isTheEndOf(CL_ANIMATION.WalkPushing, 40000) ||
              isCurrentAimation(CL_ANIMATION.StartWalkingPushing)){
              _node.setLoopMode(false);
              _node.setAnimation("stop");
          }

          if (isCurrentAimation(CL_ANIMATION.Standing))
            if (!_environment.isBatteryChargeSufficient(_index))
            // Insufficient battery charge!!
            Animation_outOfBattery();
            else
              if (_isTheEndOf(CL_ANIMATION.Standing, 2000)){
                //console.log(_index + ": _isTheEndOf Standing");
                //_node.setAnimation("stand");
                //var frm = _node.getNamedAnimationInfo(CL_ANIMATION.Standing).Begin;//_node.getFrameNr();
                _node.setAnimationSpeed(((Math.random() < 0.1)? -1:1)*(200 + random(-100,100)));
                _node.setCurrentFrame(_node.getNamedAnimationInfo(CL_ANIMATION.Standing).Begin);
              }
        }
      }

      this.setMinimalUpdateDelay = function(frames){ _node.setMinimalUpdateDelay(frames); }

      //--------------------------------------------------------------------------------------> WalkNorth
      this.WalkNorth = function(deterministic){
        var robLocation, iRow, tilesToSlide;

        if ( (_Running && _SPEED) && _currentAnimation == ANIMATION.None && (deterministic || _takeStochasticAction(_ACTION.NORTH)) &&
           (!TWorld.Battery || _environment.isBatteryChargeSufficient(_index))
          ){

          if (!deterministic)
            _LastWalkingDirection = _self.WalkNorth;

          //if Rob's currently looking to South...
          if (_node.Rot.Y != -90)
            turnAroundUntilDegrees(270);

          robLocation = _environment.getRobLocation(_index); //environment (row, column) pair

          if (_environment.slideTiles(_index, _ACTION.NORTH))
            rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkNorth);

          //if Rob's can move to South (that is, there's no holes or obstacles)
          if (_environment.isAValidMovement(_index, robLocation.Row-1, robLocation.Column)){
            _targetXZ.X -= _FloorCellSize;
            _environment.robWalkingToNorth(_index);

            _currentAnimation = ANIMATION.WalkNorth;
            _startTimeStamp = 0;
            _startLoc = _node.Pos.X;
            Animation_Walk();
          }else
            Animation_cannotDoThat();
        }
      }

      //--------------------------------------------------------------------------------------> WalkSouth
      this.WalkSouth = function(deterministic){
        var robLocation, iRow;

        if ( (_Running && _SPEED) && _currentAnimation == ANIMATION.None && (deterministic || _takeStochasticAction(_ACTION.SOUTH)) &&
           (!TWorld.Battery || _environment.isBatteryChargeSufficient(_index))
          ){

          if (!deterministic)
            _LastWalkingDirection = _self.WalkSouth;

          //if Rob's currently looking to North...
          if (_node.Rot.Y != 90)
            turnAroundUntilDegrees(90);

          robLocation = _environment.getRobLocation(_index);

          if (_environment.slideTiles(_index, _ACTION.SOUTH))
            rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkSouth);

          //if Rob's can move to North (that is, there's no holes or obstacles)
          if (_environment.isAValidMovement(_index, robLocation.Row+1, robLocation.Column)) {
            _targetXZ.X += _FloorCellSize;
            _environment.robWalkingToSouth(_index);

            _currentAnimation = ANIMATION.WalkSouth;
            _startTimeStamp = 0;
            _startLoc = _node.Pos.X;
            Animation_Walk();
          }else
            Animation_cannotDoThat();
        }
      }

      //--------------------------------------------------------------------------------------> WalkEast
      this.WalkEast = function(deterministic){
        var robLocation, iColumn;

        if ( (_Running && _SPEED) && _currentAnimation == ANIMATION.None && (deterministic || _takeStochasticAction(_ACTION.EAST)) &&
           (!TWorld.Battery || _environment.isBatteryChargeSufficient(_index))
          ){

          if (!deterministic)
            _LastWalkingDirection = _self.WalkEast;

          //if Rob's currently looking East...
          if (_node.Rot.Y != 0)
            turnAroundUntilDegrees(0);

          robLocation = _environment.getRobLocation(_index);

          if (_environment.slideTiles(_index, _ACTION.EAST))
            rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkEast);

          //if Rob's can move to East (that is, there's no holes or obstacles)
          if (_environment.isAValidMovement(_index, robLocation.Row, robLocation.Column+1)) {
            _targetXZ.Y += _FloorCellSize;
            _environment.robWalkingToEast(_index);

            _currentAnimation = ANIMATION.WalkEast;
            _startTimeStamp = 0;
            _startLoc = _node.Pos.Z;
            Animation_Walk();
          }else
            Animation_cannotDoThat();
        }
      }

      //--------------------------------------------------------------------------------------> WalkWest
      this.WalkWest = function(deterministic){
        var robLocation, iColumn;

        if ( (_Running && _SPEED) && _currentAnimation == ANIMATION.None && (deterministic || _takeStochasticAction(_ACTION.WEST)) &&
           (!TWorld.Battery || _environment.isBatteryChargeSufficient(_index))
          ){

          if (!deterministic)
            _LastWalkingDirection = _self.WalkWest;

          //if Rob's currently looking West...
          if (_node.Rot.Y != 180)
            turnAroundUntilDegrees(180);

          robLocation = _environment.getRobLocation(_index);

          if (_environment.slideTiles(_index, _ACTION.WEST))
            rearrangeTileNodesOnTheFloorMatrix(ANIMATION.WalkWest);

          //if Rob's can move to West (that is, there's no holes or obstacles)
          if (_environment.isAValidMovement(_index, robLocation.Row, robLocation.Column-1))
          {

            _targetXZ.Y -= _FloorCellSize;
            _environment.robWalkingToWest(_index);

            _currentAnimation = ANIMATION.WalkWest;
            _startTimeStamp = 0;
            _startLoc = _node.Pos.Z;
            Animation_Walk();

          }else
            Animation_cannotDoThat();
        }
      }
    //end region Public Methods
    //
    //region Private
      //-----------------------------------------------------------------------------------------> _takeStochasticAction
      function _takeStochasticAction(action){if (TWorld.Deterministic) return true;
        var rndValue, newAction;

        rndValue = UncertaintyMaker(0, TWorld.ModelOfStochasticMotion);

        switch (rndValue){
          case 0:
            return true;
          case 4:
            if (_AGENTS[_index].CONTROLLED_BY_AI)
              _environment.askForNextAction(_index);
            Animation_cannotDoThat(true);
            return false;
          case 1:
            switch (action){
              case _ACTION.NORTH:
                _self.WalkWest(true);
                break;
              case _ACTION.SOUTH:
                _self.WalkEast(true);
                break;
              case _ACTION.WEST:
                _self.WalkSouth(true);
                break;
              case _ACTION.EAST:
                _self.WalkNorth(true);
                break;
            }
            return false;
          case 2:
            switch (action){
              case _ACTION.NORTH:
                _self.WalkEast(true);
                break;
              case _ACTION.SOUTH:
                _self.WalkWest(true);
                break;
              case _ACTION.WEST:
                _self.WalkNorth(true);
                break;
              case _ACTION.EAST:
                _self.WalkSouth(true);
                break;
            }
            return false;
          case 3:
            switch (action){
              case _ACTION.NORTH:
                _self.WalkSouth(true);
                break;
              case _ACTION.SOUTH:
                _self.WalkNorth(true);
                break;
              case _ACTION.WEST:
                _self.WalkEast(true);
                break;
              case _ACTION.EAST:
                _self.WalkWest(true);
                break;
            }
            return false;
        }
      }

      //-----------------------------------------------------------------------------------------> nextMovementIfNecessary
      function nextMovementIfNecessary(){
          if (_Running){
            if (_AGENTS[_index].CONTROLLED_BY_AI){
              //now that you just stop walking, you're ready to start to think about the new action to do
              _environment.askForNextAction(_index);
            }else{
              //if User's pressed a key while Rob started moving from the previous location...
              //...what was that key user has pressed?
              switch (_LastKeyPressedIndex){
                case 0://is it the left arrow key?
                  if (_LastWalkingDirection && _prevLastKeyPressedIndex == 0)
                    _LastWalkingDirection.call();
                  else
                    _self.leftArrowKeyPressed(); 
                  break;
                case 1://is it the right arrow key?
                  if (_LastWalkingDirection && _prevLastKeyPressedIndex == 1)
                    _LastWalkingDirection.call();
                  else
                    _self.rightArrowKeyPressed();
                  break;
                case 2://is it the up arrow key?
                  if (_LastWalkingDirection && _prevLastKeyPressedIndex == 2)
                    _LastWalkingDirection.call();
                  else
                    _self.upArrowKeyPressed();
                  break;
                case 3://is it the down arrow key?
                  if (_LastWalkingDirection && _prevLastKeyPressedIndex == 3)
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
                          if (isCurrentAimation(CL_ANIMATION.Walk) ||
                            isCurrentAimation(CL_ANIMATION.WalkPushing))
                            Animation_StopWalking_End();

                          _prevLastKeyPressedIndex = -1;
                        }
              }
              if (_LastKeyPressedIndex != -1)
                _prevLastKeyPressedIndex = _LastKeyPressedIndex;
            }
          }
        }

      //-----------------------------------------------------------------------------------------> fillHoleIfSo
      function fillHoleIfSo(direction){
        if (!_EASY_MODE && _environment.isThereAHoleToFill(_index))
          _gTWorld.fillHole(_index, direction, _environment.getCellToFill(_index));
      }

      //-----------------------------------------------------------------------------------------> _isTheEndOf
      function _isTheEndOf(animationIndex, offset){
        offset = offset || 1000;

        return  _node.getFrameNr() >= _node.getNamedAnimationInfo(animationIndex).End-offset && 
            _node.getFrameNr() <= _node.getNamedAnimationInfo(animationIndex).End;
      }

      //-----------------------------------------------------------------------------------------> isCurrentAimation
      function isCurrentAimation(index){
        return (_node.getNamedAnimationInfo(index).Begin <= _node.getFrameNr() &&
            _node.getFrameNr() <= _node.getNamedAnimationInfo(index).End);
      }

      //-----------------------------------------------------------------------------------------> getWalkingCaseAccordingToCameraLocation
      function getWalkingCaseAccordingToCameraLocation(){
        var activeCamera = _gTWorld.getActiveCamera();
        var activeCameraTarget = activeCamera.getTarget();
        var activeCameraAngle = To360Degrees(CL3D.radToDeg(Math.atan2(activeCamera.Pos.X- activeCameraTarget.X, activeCamera.Pos.Z - activeCameraTarget.Z)));

        if (45 <= activeCameraAngle && activeCameraAngle < 135 )
          return CAMERA_LOCATION.West; //Camera is west of Rob
        else
          if ( 135 <= activeCameraAngle && activeCameraAngle < 225 )
            return CAMERA_LOCATION.South; //Camera is south of Rob
          else
            if (225 <= activeCameraAngle && activeCameraAngle < 315 )
              return CAMERA_LOCATION.East; //Camera is east of Rob
            else
              return CAMERA_LOCATION.North; //Camera is north of Rob
      }

      //-----------------------------------------------------------------------------------------> rearrangeTileNodesOnTheFloorMatrix
      function rearrangeTileNodesOnTheFloorMatrix(theCase){
        if (_listOfTilesToSlide.empty()) return;

        var xSlide = 0, ySlide = 0;
        var nodesOnTheFloor = _gTWorld.getOnTheFloorMatrix();

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
                    _self.WalkWest();
                    break;
                  case KEY_PRESSED.Right:
                    _self.WalkEast();
                    break;
                  case KEY_PRESSED.Up:
                    _self.WalkNorth();
                    break;
                  case KEY_PRESSED.Down:
                    _self.WalkSouth();
                    break;
                }
                break;
              case CAMERA_LOCATION.South: //Camera is south of Rob
                switch(keyPressedCase){
                  case KEY_PRESSED.Left:
                    _self.WalkNorth();
                    break;
                  case KEY_PRESSED.Right:
                    _self.WalkSouth();
                    break;
                  case KEY_PRESSED.Up:
                    _self.WalkEast();
                    break;
                  case KEY_PRESSED.Down:
                    _self.WalkWest();
                    break;
                }
                break;
              case CAMERA_LOCATION.East: //Camera is east of Rob
                switch(keyPressedCase){
                  case KEY_PRESSED.Left:
                    _self.WalkEast();
                    break;
                  case KEY_PRESSED.Right:
                    _self.WalkWest();
                    break;
                  case KEY_PRESSED.Up:
                    _self.WalkSouth();
                    break;
                  case KEY_PRESSED.Down:
                    _self.WalkNorth();
                    break;
                }
                break;
              case CAMERA_LOCATION.North: //Camera is north of Rob
                switch(keyPressedCase){
                  case KEY_PRESSED.Left:
                    _self.WalkSouth();
                    break;
                  case KEY_PRESSED.Right:
                    _self.WalkNorth();
                    break;
                  case KEY_PRESSED.Up:
                    _self.WalkWest();
                    break;
                  case KEY_PRESSED.Down:
                    _self.WalkEast();
                    break;
                }
                break;
            }//switch
          }//if ANIMATION is NONE
        }
      //end region behavior
      //
      //region Animation Functions
        //--------------------------------------------------------------------------------------> Animation_EyesBlinking
        function Animation_EyesBlinking(){
          setTimeout(
            function(){
              if (_ACTIVE_CAMERA != _CAMERA_TYPE.FIRST_PERSON)
                _node.getMaterial(38).Tex1 = _node.getMaterial(40).Tex1 = _textureManager.getTexture("./copperlichtdata/ojo_cerrado_diffuse_map.jpg", true);
              else
                $("#frameColor")
                  .css({opacity: 1 , 'background-color' : 'rgb(6, 16, 23)'})
                  .show()
                  .stop(true).animate({opacity:0}, 50, function(){$("#frameColor").hide();});
              setTimeout(
                function(){
                  if ( _environment.isBatteryChargeSufficient(_index) && (_ACTIVE_CAMERA != _CAMERA_TYPE.FIRST_PERSON)){
                    _node.getMaterial(40).Tex1 = _textureManager.getTexture("./copperlichtdata/ojoder_diffuse_map.jpg", true); /*der*/
                    _node.getMaterial(38).Tex1 = _textureManager.getTexture("./copperlichtdata/ojoizq_diffuse_map.jpg", true); /*izq*/
                  }
                  Animation_EyesBlinking();
                }
                ,
                50/(_SPEED?_SPEED:1)
              );
            }
            ,
            random(100, 5000)/(_SPEED?_SPEED:1)
          );
        }

        //--------------------------------------------------------------------------------------> Animation_cannotDoThat
        function Animation_outOfBattery(){
          if (_ACTIVE_CAMERA != _CAMERA_TYPE.FIRST_PERSON)
            _node.getMaterial(38).Tex1 = _node.getMaterial(40).Tex1 = _textureManager.getTexture("./copperlichtdata/ojo_cerrado_diffuse_map.jpg", true);
          _node.setLoopMode(true);
          _node.setAnimation("stand");
          _node.setAnimationSpeed(1);
        }
        //--------------------------------------------------------------------------------------> Animation_cannotDoThat
        function Animation_cannotDoThat(no){
          var _currentWalkAnimationFrame = _node.getFrameNr();

          _node.setLoopMode(false);

          if (!no && isCurrentAimation(CL_ANIMATION.Walk)){

            if (_AUDIO_ENABLE){
              _sound_walk.stop();
              _sound_voice_cant_walking[random(_sound_voice_cant_walking.length)].play();
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

            if (_AUDIO_ENABLE){
              _sound_walk.stop();
              _sound_voice_cant[UncertaintyMaker(0,_sound_voice_cant.prob)].play();
            }
          }

          _currentAnimation = ANIMATION.CantDoThat;

          _environment.updateStats(_index, 1/*bad_moves*/);
          _environment.updateBattery(_index, -_BATTERY_INVALID_MOVE_COST);
        }

        //--------------------------------------------------------------------------------------> Animation_Walk
        function Animation_Walk (){
          if (_AUDIO_ENABLE && _SPEED === 1)
            _sound_walk.play();

          if (_listOfTilesToSlide.empty()){
            if (!isCurrentAimation(CL_ANIMATION.Walk)){
              _node.setLoopMode(true);
              _node.setAnimation("walk");
              _node.setCurrentFrame(_node.getNamedAnimationInfo(CL_ANIMATION.Walk).End - (130000-Math.random()*70000));
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
        function Animation_stopWalking (){
          if (!_listOfTilesToSlide.empty()){
            nodesOnTheFloor = _gTWorld.getOnTheFloorMatrix();
            for (var i= 0, tileCoordinates, nodesOnTheFloor; i < _listOfTilesToSlide.getLength(); i++){
              tileCoordinates = _listOfTilesToSlide.getItemAt(i);
              nodesOnTheFloor[tileCoordinates[0]][tileCoordinates[1]].Pos.X = GraphicTWorld.RowIndexToXPosition(tileCoordinates[0]);
              nodesOnTheFloor[tileCoordinates[0]][tileCoordinates[1]].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(tileCoordinates[1]);
            }

            _listOfTilesToSlide.removeAll();
          }

          _environment.robGetLocation(_index);
          _currentAnimation = ANIMATION.None;

          nextMovementIfNecessary();
        }

        //--------------------------------------------------------------------------------------> Animation_StopWalking_End
        function Animation_StopWalking_End(){
          var getFrameNrCache = _node.getFrameNr();
          _node.Pos.X = _targetXZ.X;
          _node.Pos.Z = _targetXZ.Y;

          if (!isCurrentAimation(CL_ANIMATION.StopWalking)){
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
        }

        //--------------------------------------------------------------------------------------> Animation_WalkNorth
        function Animation_WalkNorth(timeElapsed){
          if (_node.Pos.X > _targetXZ.X){
            var offset = _FloorCellSize*(_startTimeStamp+=timeElapsed)/_ROB_WALK_TIME;
            _node.Pos.X= _startLoc - ((offset <= _FloorCellSize)? offset : _FloorCellSize);

            for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
              tileCoordinates = _listOfTilesToSlide.getItemAt(i);
              CL_Tile = _gTWorld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
              if (CL_Tile)
                CL_Tile.Pos.X=_node.Pos.X-_FloorCellSize*(i+1);
            }

            if (offset >= 4)
              fillHoleIfSo(_ACTION.NORTH);
          }else
            if (_environment.isThereAHoleFilling(_index)){
              Animation_WaitingForHoleToBeFilled();
            }else
              Animation_stopWalking();
        }

        //--------------------------------------------------------------------------------------> Animation_WalkSouth
        function Animation_WalkSouth(timeElapsed){
          if (_node.Pos.X < _targetXZ.X){
            var offset = _FloorCellSize*(_startTimeStamp+=timeElapsed)/_ROB_WALK_TIME;
            _node.Pos.X= _startLoc + ((offset <= _FloorCellSize)? offset : _FloorCellSize);

            for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
              tileCoordinates = _listOfTilesToSlide.getItemAt(i);
              CL_Tile = _gTWorld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
              if (CL_Tile)
                CL_Tile.Pos.X=_node.Pos.X+_FloorCellSize*(i+1);
            }

            if (offset >= 4)
              fillHoleIfSo(_ACTION.SOUTH);
          }else
            if (_environment.isThereAHoleFilling(_index)){
              Animation_WaitingForHoleToBeFilled();
            }else
              Animation_stopWalking();
        }

        //--------------------------------------------------------------------------------------> Animation_WalkEast
        function Animation_WalkEast(timeElapsed){
          if (_node.Pos.Z < _targetXZ.Y){
            var offset = _FloorCellSize*(_startTimeStamp+=timeElapsed)/_ROB_WALK_TIME;
            _node.Pos.Z= _startLoc + ((offset <= _FloorCellSize)? offset : _FloorCellSize);

            for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
              tileCoordinates = _listOfTilesToSlide.getItemAt(i);
              CL_Tile = _gTWorld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
              if (CL_Tile)
                CL_Tile.Pos.Z=_node.Pos.Z+_FloorCellSize*(i+1);
            }

            if (offset >= 4)
              fillHoleIfSo(_ACTION.EAST);
          }else
            if (_environment.isThereAHoleFilling(_index)){
              Animation_WaitingForHoleToBeFilled();
            }else
              Animation_stopWalking();
        }

        //--------------------------------------------------------------------------------------> Animation_WalkWest
        function Animation_WalkWest(timeElapsed){
          if (_node.Pos.Z > _targetXZ.Y){
            var offset = _FloorCellSize*(_startTimeStamp+=timeElapsed)/_ROB_WALK_TIME;
            _node.Pos.Z= _startLoc - ((offset <= _FloorCellSize)? offset : _FloorCellSize);

            for (var i= 0, tileCoordinates, CL_Tile, length = _listOfTilesToSlide.getLength(); i < length; i++){
              tileCoordinates = _listOfTilesToSlide.getItemAt(i);
              CL_Tile = _gTWorld.getNodeOnTheFloorAt(tileCoordinates[0], tileCoordinates[1]);
              if (CL_Tile)
                CL_Tile.Pos.Z=_node.Pos.Z-_FloorCellSize*(i+1);
            }

            if (offset >= 4)
              fillHoleIfSo(_ACTION.WEST);
          }else
            if (_environment.isThereAHoleFilling(_index)){
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
          _turnAroundOffsetAngle = To360Degrees(_node.Rot.Y);
          //taking into account where Rob's looking at, how many degrees should Rob turn around?
          _turnAroundFinalAngle = finalDegrees - _turnAroundOffsetAngle;

          //Rob! don't turn more than 180º, there's another shorter way, for instance, turning more than 180º to your left could be achieved turning to 
          //your right a less amount of degrees! an example of this would be, turning 270º to your left is the same as turning 90º to your right
          _turnAroundFinalAngle = (_turnAroundFinalAngle < -180)?
                        _turnAroundFinalAngle + 360
                        :
                        (_turnAroundFinalAngle > 180)?
                            _turnAroundFinalAngle - 360
                            :
                            _turnAroundFinalAngle;

          _turnAroundStartAngle = _turnAroundOffsetAngle;

          _turnAroundFlag = true;
          _startRotationTimeStamp = 0;
        }
      //end region Animation Functions
    //end region Private Methods
  //end region Methods
  //
  //region Constructor Logic --------------------------------------------------------------> Constructor Begin

    if (!_AGENTS[_index].CONTROLLED_BY_AI && !_AGENTS[_index].SOCKET_PROGRAM_AGENT){
    //region User Input Handler
      //-> keyDown Event Handler
      $(document).keydown(function(e){
        if (IsValidKey(e.keyCode)){
          switch(e.keyCode){
            case _AGENTS[_index].CONTROLS.Left:
              _self.leftArrowKeyPressed(true);
              break;
            case _AGENTS[_index].CONTROLS.Right:
              _self.rightArrowKeyPressed(true);
              break;
            case _AGENTS[_index].CONTROLS.Up:
              _self.upArrowKeyPressed(true);
              break;
            case _AGENTS[_index].CONTROLS.Down:
              _self.downArrowKeyPressed(true);
              break;
            case _AGENTS[_index].CONTROLS.Restore:
              _self.restoreBattery();
          }
        }
      });

      //-> keyUp Event Handler
      $(document).keyup(function(e){
        if (IsValidKey(e.keyCode)){
          switch (e.keyCode){
            case _AGENTS[_index].CONTROLS.Left:
              _self.keyUp(0);
              break;
            case _AGENTS[_index].CONTROLS.Right:
              _self.keyUp(1);
              break;
            case _AGENTS[_index].CONTROLS.Up:
              _self.keyUp(2);
              break;
            case _AGENTS[_index].CONTROLS.Down:
              _self.keyUp(3);
              break;
          }
        }
      });
    //end region User Input Handler
    }

    _node.setCurrentFrame(_node.getNamedAnimationInfo(CL_ANIMATION.Standing).End*Math.random());

    _node.Rot.Y = -180;

    //Rob! start blinking
    Animation_EyesBlinking();
  //end region Constructor Logic --------------------------------------------------------------> Constructor End
}