/*
* solid-graphic.js - 
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

//Class  GraphicTWorld
function GraphicTWorld(graphicEngine, environment){
    //region Attributes
    //-Static:

    //private:
        //Note: _CL_ stands for CopperLitch
        //      _CLN_ stands for CopperLitch Node (which in this context will mean "3D Object(s)")
        var _CL_Scene;
        var _CL_Engine      = graphicEngine;
        var _CL_Canvas      = _CL_Engine.getRenderer().getWebGL().canvas; //used for calculatin the x and y-scale when animating the score
        var _CL_OnTheFloor  = NewMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
        var _CL_HoleHelpers = NewMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
        var _CL_Floor       = NewMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
        var _CL_LaserBeams  = new Array();
        var _CL_UserHelpers = null;
        var _CLN_Rob        = new Array(_NUMBER_OF_AGENTS);
        var _CL_Rob_Texturs = {};
        var _CLN_FloorBase;
        var _CLN_UFO;
        var _CLN_LaserGlow;
        var _CLN_S3AR;
        var _CLN_BatteryIcon = new Array();
        var _CLN_BatteryElect = new Array();
        var _CL_VisibilityBox = new Array(_NUMBER_OF_AGENTS);

        var _self = this;
        var _clOnAnimateCallBack; //for keeping a pointer to the original CopperLitch onAnimate function

        var _floorLimits = new Object();

        //Fps & time
        var _FPSSum             = _FPS;
        var _FPSAvgCounter      = 0;
        var _timeAccumulador    = 0;
        var _oldCurrentTime     = 0;
        var _perceptTimeAccum   = new Uint32Array(_NUMBER_OF_AGENTS);

        //used for camara animation
        var _CL_ActiveCamera;
        var _CL_ActiveCameraTarget;
        var _cameraAnimationFlag = 0; // 0- none; 1- Pos + Radius; 2- Only Radius
        var _cameraReadyFlag = true;
        var _AnimationFactor;
        var _cameraXPosOffset; // Auxiliary variable used to achieve the follow-Rob camera's 'smooth movement'
        var _cameraZPosOffset; // Auxiliary variable used to achieve the follow-Rob camera's 'smooth movement'
        var _cameraTargetFinalPos = new CL3D.Vect3d();
        var _cameraFinalPos = new CL3D.Vect3d();
        var _cameraFinalRadius;
        var _cameraFixedPosY = 0;
        var _cameraShakingFlag = false;
        var _cameraShakingOrg = 0;
        var _FollowRob = true;
        var _cameraFirtPerson = false;
        var _CL_CameraModelViewer;
        var _CL_CameraFlyCircle = new CL3D.AnimatorFlyCircle();
        var _CL_CursorControl;

        var _scoreAnimation = new Array(_NUMBER_OF_AGENTS);

        var _targetSpeed = _SPEED;
        var _initialSpeed = _SPEED;

        //UFO Fly Cricle Animation
        var _UFOFlySpeed    = 0.02;//0.01;
        var _UFOFlyRadius   = -1;
        var _UFOFlyCenter   = new CL3D.Vect3d(10, 50, 80);

        //sounds & voices
        if (_AUDIO_ENABLE){
            var _sound_beep             = new buzz.sound("./sounds/beep.mp3");
            var _sound_timer            = new buzz.sound("./sounds/timer.mp3");
            var _sound_game_won         = new buzz.sound("./sounds/game-won.mp3");
            var _sound_pause_on         = new buzz.sound("./sounds/pause_on.mp3");
            var _sound_pause_off        = new buzz.sound("./sounds/pause_off.mp3");
            var _sound_ufo_laser        = new buzz.sound("./sounds/laser.mp3");
            var _sound_game_lost        = [new buzz.sound("./sounds/game-lost0.mp3"), new buzz.sound("./sounds/game-lost1.mp3")];
            var _sound_score_full       = new buzz.sound("./sounds/score-full2.mp3");
            var _sound_score_light      = new buzz.sound("./sounds/score.mp3");
            var _sound_game_neutral     = new buzz.sound("./sounds/game-neutral.mp3");
            var _sound_teleport_bad     = new buzz.sound("./sounds/teleport-bad.mp3");
            var _sound_teleport_tile    = new buzz.sound("./sounds/teleport-tile.mp3");
            var _sound_teleport_good    = new buzz.sound("./sounds/teleport-good.mp3");
            var _sound_battery_danger   = new buzz.sound("./sounds/battery-danger.mp3");
            var _sound_out_of_battery   = new buzz.sound("./sounds/rob-turns-off.mp3");
            var _sound_ufo_laser_short  = new buzz.sound("./sounds/laser-short.mp3");
            var _sound_battery_charger  = new buzz.sound("./sounds/battery-charger.mp3");
            var _sound_score_full_light = new buzz.sound("./sounds/score-full.mp3");

            var _sound_voice_restore_energy = new Array(4);
            var _sound_voice_battery_danger = new Array(2);
            var _sound_voice_full_energy    = new Array(2);
            var _sound_voice_countdown      = new Array(11);
            var _sound_voice_pause          = new buzz.sound("./sounds/voices/"+_LANGUAGE.toLowerCase()+"/voice_pause.mp3");
            
            for (var i=_sound_voice_countdown.length; i--;)
                _sound_voice_countdown[i] = new buzz.sound("./sounds/voices/"+_LANGUAGE.toLowerCase()+"/voice_"+i+".mp3");
            for (var i=_sound_voice_full_energy.length; i--;)
                _sound_voice_full_energy[i] = new buzz.sound("./sounds/voices/"+_LANGUAGE.toLowerCase()+"/voice_full-energy"+i+".mp3");
            for (var i=_sound_voice_battery_danger.length; i--;)
                _sound_voice_battery_danger[i] = new buzz.sound("./sounds/voices/"+_LANGUAGE.toLowerCase()+"/voice_battery-danger"+i+".mp3");
            for (var i=_sound_voice_restore_energy.length; i--;)
                _sound_voice_restore_energy[i] = new buzz.sound("./sounds/voices/"+_LANGUAGE.toLowerCase()+"/voice_battery-restore"+i+".mp3");
        }
    //public
        this.Environment = environment;
        this.Rob  = new Array(1);
//end region Attributes
//
//region Methods
    //region Public
        //region Getters And Setters
            this.getOnTheFloorMatrix    = function() {return _CL_OnTheFloor;}
            this.getNodeOnTheFloorAt    = function(row, column) {return _CL_OnTheFloor[row][column];}
            this.getFloorCellSize       = function() {return _FloorCellSize;}
            this.getActiveCamera        = function() {return _CL_ActiveCamera;}
            this.getFloorLimits         = function() {return _floorLimits;}
            this.getCLEngine            = function() {return _CL_Engine;}

            this.setRobLocation     = function(rIndex, row, column) {
                if (this.Rob[rIndex]){
                    this.Rob[rIndex].setXZ(row*_FloorCellSize + _floorLimits.X0, column*_FloorCellSize);

                    if (!TWorld.FullyObservableGrid)
                        _self.updateVisibilityBounds(rIndex, row, column);
                }
            }

            this.setBatteryChargerLocation = function(row, column){
                bcIndex = _CLN_BatteryIcon.length;

                if (_CLN_BatteryIcon.length == 0){
                    _CLN_BatteryIcon.push(_CL_Scene.getSceneNodeFromName('battery-charger-icon'));
                    _CLN_Rob[0].getParent().addChild(_CLN_BatteryIcon[0]);
                }else
                    _CLN_BatteryIcon.push(_CLN_BatteryIcon[0].createClone(_CLN_Rob[0].getParent()));

                _CLN_BatteryIcon[bcIndex].Pos.X = GraphicTWorld.RowIndexToXPosition(row);
                _CLN_BatteryIcon[bcIndex].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(column);
                _CLN_BatteryIcon[bcIndex].setVisible(true);

                _CL_Floor[row][column][1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_battery.png", true);
                _CL_Floor[row][column][0].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_battery.png", true);;

                _CLN_BatteryElect.push( _CL_Scene.getSceneNodeFromName('obstacle').createClone(_CL_Scene.getSceneNodeFromName('dummy')) );
                _CLN_BatteryElect[bcIndex].Pos.X = GraphicTWorld.RowIndexToXPosition(row);
                _CLN_BatteryElect[bcIndex].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(column);
                _CLN_BatteryElect[bcIndex].Scale.Y = 3;
                _CLN_BatteryElect[bcIndex].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/battery-elec.png", true);
                _CLN_BatteryElect[bcIndex].setCurrentFrame(Math.random()*_CLN_BatteryElect[bcIndex].getNamedAnimationInfo(0).End);
                _CLN_BatteryElect[bcIndex].setVisible(true);
            }
        //end region Getters And Setters
        //
        //region Static
            //--------------------------------------------------------------------------------------------------------------------> RowIndexToXPosition
            GraphicTWorld.RowIndexToXPosition = function(irow) {return (irow*_FloorCellSize - _CL_Floor.length*_FloorCellSize/2);}

            //--------------------------------------------------------------------------------------------------------------------> ColumnIndexToZPosition
            GraphicTWorld.ColumnIndexToZPosition = function(icolumn) {return (icolumn*_FloorCellSize);}
        //end region Static

        this.RobWalkNorth = function(rIndex, relative){
            if (relative)
                _self.Rob[rIndex].upArrowKeyPressed(true);
            else
                _self.Rob[rIndex].WalkNorth();
        }
        this.RobWalkSouth = function(rIndex, relative){
            if (relative)
                _self.Rob[rIndex].downArrowKeyPressed(true);
            else
                _self.Rob[rIndex].WalkSouth();
        }
        this.RobWalkEast = function(rIndex, relative){
            if (relative)
                _self.Rob[rIndex].rightArrowKeyPressed(true);
            else
                _self.Rob[rIndex].WalkEast();
        }
        this.RobWalkWest = function(rIndex, relative){
            if (relative)
                _self.Rob[rIndex].leftArrowKeyPressed(true);
            else
                _self.Rob[rIndex].WalkWest();
        }

        this.keyUp = function(rIndex, key){
            switch( key ){
                case 0:
                case "LEFT":
                    this.Rob[rIndex].keyUp(0); break;
                case 1:
                case "RIGHT":
                    this.Rob[rIndex].keyUp(1); break;
                case 2:
                case "UP":
                    this.Rob[rIndex].keyUp(2); break;
                case 3:
                case "DOWN":
                    this.Rob[rIndex].keyUp(3); break;
            }
        }

        this.keyDown = function(rIndex, key){
            switch( key ){
                case 0:
                case "LEFT":
                    _self.RobWalkWest(rIndex, true); break;
                case 1:
                case "RIGHT":
                    _self.RobWalkEast(rIndex, true); break;
                case 2:
                case "UP":
                    _self.RobWalkNorth(rIndex, true); break;
                case 3:
                case "DOWN":
                    _self.RobWalkSouth(rIndex, true); break;
                case 4:
                case "START":
                    if (!_Running && $("#playBtn"))
                        $("#playBtn").mouseup();
                    else
                        _togglePause();
                    break;
                case 5:
                case "CAMERA":
                    _self.toggleCamera(); break;
                case 6:
                case "RESET":
                    location.reload(); break;
                case 7:
                case "FULL_SCREEN":
                    ToggleFullScreen(document.getElementById("tw-root")); break;
            }
        }

        this.restoreBattery = function(rIndex, noStats){this.Rob[rIndex].restoreBattery(noStats)}

        this.gameIsOver = function(robs, goal, time) {
            var cameraCase, finalPositions = new Array(3), firstOne;
            var minRegEx = /min/i, maxRegEx = /max/i;
            var _i = {
                maxMoves: {v: 0, $e: $('#max-moves')},
                minMoves: {v: 0, $e: $('#min-moves')},

                maxbad_moves: {v: 0, $e: $('#invalid-moves')},
                maxCells: {v: 0, $e: $('#max-cells')},
                maxHoles: {v: 0, $e: null},
                maxBatteryUse: {v: 0, $e: $('#max-battery-use')},
                maxBatteryRecharge: {v: 0, $e: $('#max-battery-recharge')},
                maxBatteryRestore: {v: 0, $e: $('#max-battery-restore')},
                maxScore: {v: 0, $e: $('#max-score')}
            }

            //TEAMS STATS:
            for (var holes, moves, battery, i=0; i < _TEAMS.length; i++){
                _TEAMS[i].stats = {
                                    MFinalScore: 0,
                                    MTotalScore: 0,
                                    MHoles: 0,
                                    MCells: 0,
                                    mgood_moves: 0,
                                    mbad_moves: 0,
                                    mBattery_Used:0,
                                    mBattery_Restore:0,
                                    mBattery_Recharge:0,
                                };
                for (var m=_TEAMS[i].MEMBERS.length; m--;){
                    _TEAMS[i].stats.MFinalScore += robs[_TEAMS[i].MEMBERS[m]].Score;
                    _TEAMS[i].stats.MTotalScore += robs[_TEAMS[i].MEMBERS[m]].Stats.total_score;
                    _TEAMS[i].stats.MHoles += robs[_TEAMS[i].MEMBERS[m]].Stats.filled_holes;
                    _TEAMS[i].stats.MCells += robs[_TEAMS[i].MEMBERS[m]].Stats.filled_cells;
                    _TEAMS[i].stats.mgood_moves += robs[_TEAMS[i].MEMBERS[m]].Stats.good_moves;
                    _TEAMS[i].stats.mbad_moves += robs[_TEAMS[i].MEMBERS[m]].Stats.bad_moves;
                    _TEAMS[i].stats.mBattery_Used += robs[_TEAMS[i].MEMBERS[m]].Stats.battery_used;
                    _TEAMS[i].stats.mBattery_Restore += robs[_TEAMS[i].MEMBERS[m]].Stats.battery_restore;
                    _TEAMS[i].stats.mBattery_Recharge += robs[_TEAMS[i].MEMBERS[m]].Stats.battery_recharge;
                }
            }

            //in case of tied game the method to try to break the tie, in order, is:
            // +FinalScore
            // +TotalScore
            // +Holes
            // +Cells
            // -good_moves
            // -bad_moves
            // -Battery_Used
            // -Battery_Restore
            // -Battery_Recharge
            finalPositions = SortAndPartition(_TEAMS).flatteningAllButTied();

            //1st, 2nd and 3rd positions
            for (var pos = 0, r=0; r < 3; ++r, ++pos){
                if (r < _TEAMS.length){
                    if (finalPositions[pos] instanceof Array){// if it is a group of tied results
                        for (var i= 0; i < finalPositions[pos].length && r < 3; ++i, ++r){
                            $('#'+(r+1)+'-pos').append('<img src="./imgs/'+(pos+1)+'-pos.png" />');
                            $('#'+(r+1)+'-player').html(finalPositions[pos][i].NAME);
                            $('#'+(r+1)+'-score').html(finalPositions[pos][i].stats.MFinalScore + "/" + finalPositions[pos][i].stats.MTotalScore);
                            $('#'+(r+1)+'-holes').html(finalPositions[pos][i].stats.MHoles + "/" + finalPositions[pos][i].stats.MCells);
                            $('#'+(r+1)+'-moves').html(finalPositions[pos][i].stats.mgood_moves + "/" + finalPositions[pos][i].stats.mbad_moves);
                            $('#'+(r+1)+'-battery').html((finalPositions[pos][i].stats.mBattery_Used/10).toFixed(1) + "/" + finalPositions[pos][i].stats.mBattery_Restore);

                            if (pos === 0)
                                firstOne = finalPositions[pos][i];
                        }
                        r--;
                    }else{
                        $('#'+(r+1)+'-pos').append('<img src="./imgs/'+(pos+1)+'-pos.png" />');
                        $('#'+(r+1)+'-player').html(finalPositions[pos].NAME);
                        $('#'+(r+1)+'-score').html(finalPositions[pos].stats.MFinalScore + "/" + finalPositions[pos].stats.MTotalScore);
                        $('#'+(r+1)+'-holes').html(finalPositions[pos].stats.MHoles + "/" + finalPositions[pos].stats.MCells);
                        $('#'+(r+1)+'-moves').html(finalPositions[pos].stats.mgood_moves + "/" + finalPositions[pos].stats.mbad_moves);
                        $('#'+(r+1)+'-battery').html((finalPositions[pos].stats.mBattery_Used/10).toFixed(1) + "/" + finalPositions[pos].stats.mBattery_Restore);

                        if (pos === 0)
                            firstOne = finalPositions[pos];

                    }
                }else
                    $('#'+(r+1)+'-row').hide();
            }

            //PLAYERS STATS:
            for (var i= 1, iMm; i < _NUMBER_OF_AGENTS; i++){
                iMm = NextProperty(_i);

                for (stat in robs[i].Stats){
                    if (maxRegEx.test(iMm)){
                        if (robs[i].Stats[stat] > robs[_i[iMm].v].Stats[stat])
                            _i[iMm].v = i;
                        iMm = NextProperty(_i, iMm);
                    }
                    if (minRegEx.test(iMm)){
                        if (robs[i].Stats[stat] < robs[_i[iMm].v].Stats[stat])
                            _i[iMm].v = i;
                        iMm = NextProperty(_i, iMm);
                    }
                }
            }

            //in case of tie (hidden tie cases)
            for (var i= 0, iMm=""; i < _NUMBER_OF_AGENTS; i++){
                stat = NextProperty(robs[i].Stats);
                for (iMm in _i){
                    if (_i[iMm].$e && _i[iMm].v != i && robs[i].Stats[stat] == robs[_i[iMm].v].Stats[stat]){
                        _i[iMm].$e.parent().hide();
                        _i[iMm].$e = null;
                    }

                    if (minRegEx.test(iMm) || (maxRegEx.test(iMm) && !minRegEx.test(NextProperty(_i, iMm))))
                        stat = NextProperty(robs[i].Stats, stat);
                }
            }

            //showing results
            var stat = NextProperty(robs[0/*doesn't matter*/].Stats);
            for (iMm in _i){
                var value = robs[_i[iMm].v].Stats[stat];
                if (_i[iMm].$e)
                    _i[iMm].$e.html((!/BatteryUse/i.test(iMm)? value : (value/10).toFixed(1)+"%") + ((_NUMBER_OF_AGENTS > 1)? "<br>(" + _AGENTS[_i[iMm].v].NAME +")" : ""));

                if (minRegEx.test(iMm) || (maxRegEx.test(iMm) && !minRegEx.test(NextProperty(_i, iMm))) )
                    stat = NextProperty(robs[0].Stats, stat);
            }

            var subtitle;
            switch(goal.RESULT){
                case _GAME_RESULT.SUCCESS:
                    $("#resetBtn")
                        .addClass("center")
                        .css("width","128px")
                        .css("margin-top","-30px")
                        .css("margin-left","-64px")
                        .appendTo("#black-screen");

                    $("#title").
                        css("color","rgb(59, 255, 153)")
                        .html(_ENDGAME.MESSAGES.SUCCESS.TEXT);
                    
                    subtitle = _ENDGAME.MESSAGES.SUCCESS.SUBTEXTS[random(_ENDGAME.MESSAGES.SUCCESS.SUBTEXTS.length)];
                    $("#sub-title").html(subtitle);

                    if (_AUDIO_ENABLE)
                        _sound_game_won.play();
                    break;
                case _GAME_RESULT.FAILURE:
                    $("#resetBtn")
                        .addClass("center")
                        .css("width","128px")
                        .css("margin-top","-64px")
                        .css("margin-left","-64px")
                        .appendTo("#black-screen");

                    $("#title")
                        .css("color", "red")
                        .css("text-shadow", "rgb(255, 0, 72) 0px 0px 20px")
                        .html(_ENDGAME.MESSAGES.FAILURE.TEXT);
                    subtitle =  goal.MESSAGE? goal.MESSAGE :
                               _ENDGAME.MESSAGES.FAILURE.SUBTEXTS[random(_ENDGAME.MESSAGES.FAILURE.SUBTEXTS.length)]
                    $("#sub-title").html(subtitle);

                    if (_AUDIO_ENABLE)
                        _sound_game_lost[random(_sound_game_lost.length)].play();
                    break;
                case _GAME_RESULT.NEUTRAL:
                    $("#table-pos").show();
                    $("#bs-mid").css("opacity", 0).show();
                    $("#title").html(goal.MESSAGE? goal.MESSAGE : _ENDGAME.MESSAGES.NEUTRAL.TEXT);
                    subtitle = _ENDGAME.MESSAGES.NEUTRAL.SUBTEXTS[random(_ENDGAME.MESSAGES.NEUTRAL.SUBTEXTS.length)];
                    $("#sub-title").html(subtitle);

                    if (_AUDIO_ENABLE)
                        _sound_game_neutral.play();
            }

            $("#sub-title").html(
                $("#sub-title").html() +
                '<br><span style="font-size:13px; color: gray; text-shadow: none">(time: '+ ToMMSS(time) + ')</span>'
            );

            $("#stats").show();

            $("#table-goals").hide();
            $('#tworld').addClass("blur");
            $("#playPauseBtn").hide().addClass("no-events");
            $("#time").hide();
            $("#robs-hud").hide();
            $("#pie").hide();
            $("#pauseBtn").hide();
            $("#cameraBtn").hide();
            $("#fullScreenBtn").hide();
            $("#title").css("font-size","70px");

            $("#black-screen").show();
            $("#black-screen").animate({opacity:1}, 3000, function(){$("#bs-mid").animate({opacity:1,"margin-top": (-$("#bs-mid").height()/2|0)+"px"}, 400)});

            while ( _ACTIVE_CAMERA < _CAMERA_TYPE.AROUND_GRID )
                _self.toggleCamera();
            cameraCase = (Math.random() < 0.5 || _LOW_QUALITY_WORLD)? 0 : 1;
            if (!firstOne) firstOne = _TEAMS[0];
            _CL_CameraFlyCircle.Center.setTo((cameraCase == 0)? _CLN_Rob[firstOne.MEMBERS[0]].Pos : _CLN_S3AR.Pos);
            _CL_CameraFlyCircle.Center.Y += (cameraCase == 0)? 16 : 0;
            _cameraTargetFinalPos.setTo(_CL_CameraFlyCircle.Center);
            _CL_CameraFlyCircle.Radius = Math.sqrt(Math.pow(_CL_ActiveCamera.Pos.X,2) + Math.pow(_CL_ActiveCamera.Pos.Z,2));
            _cameraFinalRadius = (cameraCase == 0)? Math.max(_ROWS, _COLUMNS)*_FloorCellSize/2 : 1400;
            _CL_ActiveCamera.Animators.clear();
            _CL_ActiveCamera.Animators.push(_CL_CameraFlyCircle);
            _cameraAnimationFlag = 1;
            _FollowRob = false;
        }

        this.updateVisibilityBounds = function(rIndex, row, column){
            _CL_VisibilityBox[rIndex].Pos.X = GraphicTWorld.RowIndexToXPosition(row);
            _CL_VisibilityBox[rIndex].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(column);
        }

        this.paintCell = function(row, column){row = Number(row); column = Number(column);
            //creating matrix on demand
            if (!_CL_UserHelpers){
                _CL_UserHelpers = NewMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);

                _CL_UserHelpers.current = new CL3D.HoleCellHelper(0,0,0,_FloorCellSize,_CL_Engine, 0, 250, 1, 0.8);
                _CL_UserHelpers.current.Pos.Y = 4 + 1;
                _CL_Scene.getRootSceneNode().addChild(_CL_UserHelpers.current);
                _CL_UserHelpers.current.setVisible(true);
            }

            if (!_CL_UserHelpers.current.Visible)
                _CL_UserHelpers.current.setVisible(true);
            _CL_UserHelpers.current.Pos.X = GraphicTWorld.RowIndexToXPosition(row);
            _CL_UserHelpers.current.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(column);

            if (row < _CL_UserHelpers.length && column < _CL_UserHelpers[0].length){
                if (!_CL_UserHelpers[row][column]){
                    _CL_UserHelpers[row][column] = new CL3D.HoleCellHelper(0,0,0,_FloorCellSize,_CL_Engine, 0, 255, 0, 0.8);
                    _CL_UserHelpers[row][column].Pos.X = GraphicTWorld.RowIndexToXPosition(row);
                    _CL_UserHelpers[row][column].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(column);
                    _CL_UserHelpers[row][column].setVisible(true);
                    _CL_Scene.getRootSceneNode().addChild(_CL_UserHelpers[row][column]);
                }else
                if (!_CL_UserHelpers[row][column].Visible)
                    _CL_UserHelpers[row][column].setVisible(true);
                _CL_UserHelpers[row][column].Pos.Y = Math.random()*4 + 1;
            }
        }

        this.clearPaintedCells = function(){
            _CL_UserHelpers.current.Visible = false;
            for (var r = _CL_UserHelpers.length; r--;)
                    for (var c = _CL_UserHelpers[0].length; c--;)
                        if (_CL_UserHelpers[r][c])
                            _CL_UserHelpers[r][c].Visible = false;
        }

        this.updateTime = function(value, countdown) {
            $("#time").html((value > 10 || !countdown)? ToMMSS(value) : value);

            if (countdown && value <= 10){
                $("#time").css("color", "red").css("font-size","64px").css("text-shadow", "rgb(255, 0, 0) 0px 0px 10px");

                if (_AUDIO_ENABLE){
                    _sound_voice_countdown[value].play();
                    _sound_timer.setPercent(0).play();
                }
            }
        }

        this.setMultiplier = function(rIndex, Multiplier, firstOne){
            var $robMultiplier = $("#rob-"+rIndex).find("#multiplier");
            if (Multiplier.Value == 1)
                $robMultiplier.html("");
            else{
                $robMultiplier.html("x"+Multiplier.Value);
                if (firstOne)
                    $robMultiplier.stop(true).css("font-size" , 10+_MultiplierFontSize).css("opacity", 1);
                else
                    if (Multiplier.Timer > 1)
                        $robMultiplier.stop(true).animate({"font-size" : 10+_MultiplierFontSize*(Multiplier.Timer/_MULTIPLIER_TIME) + "px"}, 1000);
                    else
                        $robMultiplier.stop(true).animate({"opacity" : 0}, 1000);
            }
        }

        this.updateScore = function(rIndex, score, holeCells, filled, points, strPoints) {
            var lIndex = _GET_TEAM_LEADER(rIndex);
            var $rob = $("#rob-" + lIndex);

            $rob.find("#score").html(score);

            if (points > 0 || (points == 0 && !_SCORE_CELLS_MULTIPLIER && holeCells)){

                _scoreAnimation[rIndex].HoleFilledCells.length = holeCells.length;
                _scoreAnimation[rIndex].Points = points;
                _scoreAnimation[rIndex].StrPoints = strPoints;
                _scoreAnimation[rIndex].Filled = filled;

                for (var i=0; i < holeCells.length; i++){
                    _scoreAnimation[rIndex].HoleFilledCells[i] = [
                        GraphicTWorld.RowIndexToXPosition(holeCells[i][0]),
                        GraphicTWorld.ColumnIndexToZPosition(holeCells[i][1])
                    ];
                }

                if (filled){
                    if (_AUDIO_ENABLE)
                        _sound_score_full.setPercent(0).play();

                    $("#frameColor")
                        .css({opacity: 0.5 , 'background-color' : 'white'})
                        .show()
                        .stop(true).animate({opacity:0}, 1000, function(){$("#frameColor").hide();});
                }
            }else
            if (points < 0){
                var $scoreUp = $("#score-up-" + lIndex);
                

                $scoreUp.html(points);
                $scoreUp.css({
                    left: ($rob.find("#score").offset().left-$("#tw-root").offset().left|0)-20+'px',
                    top: ($rob.find("#score").offset().top-$("#tw-root").offset().top|0)+'px',
                    'font-size' : '30px',
                    color: 'red',
                    opacity:1
                });

                $scoreUp.show();
                $scoreUp.stop(true).animate(
                    {
                    left: (($rob.find("#score").offset().left-$("#tw-root").offset().left|0) + 80) +'px',
                    opacity:0
                    },
                    1000,
                    function(){$scoreUp.hide();$scoreUp.css("color",'rgb(255, 105, 0)').css("opacity",1)}
                );
            }

        }


        function _batteryWarning(n){
            if (n>0){
                if (_AUDIO_ENABLE)
                    _sound_battery_danger.setPercent(0).play();
                $("#robs-hud").removeClass("robsHudBackground");
                $("#robs-hud").addClass("robsHudBackgroundWarning ");

                setTimeout(function(){
                    $("#robs-hud").removeClass("robsHudBackgroundWarning ");
                    $("#robs-hud").addClass("robsHudBackground");

                    setTimeout(function(){
                        _batteryWarning(n-1)
                    },
                    1000);

                    },
                    100
                );
            }
        }

        this.updateBattery = function(rIndex, value, recharge) { if (!TWorld.Battery) return;
            rIndex = _GET_TEAM_LEADER(rIndex);
            var $id = "#rob-"+rIndex;

            if (!this.batteryWarning)
                this.batteryWarning = new Array(_NUMBER_OF_AGENTS);

            if (value <= 0) {
                value = 0;
                $($id).find("#battery-charge-frame").css("box-shadow", "0 0 10px red");
                if (_AUDIO_ENABLE)
                    _sound_out_of_battery.setPercent(0).play();
            }else
                if (recharge){
                    value = 1000;
                    $($id).find("#battery-charge-frame").css("box-shadow", "0 0 10px rgba(87, 255, 168, 0.57)");

                    if (_Running){

                        if (_AUDIO_ENABLE){
                            var _voice = recharge == 2?/*if restoration*/
                                            _sound_voice_full_energy[random(_sound_voice_full_energy.length)]:
                                            _sound_voice_restore_energy[random(_sound_voice_restore_energy.length)];
                            CallWithDelay.Enqueue(_voice.play, null, 2, _voice);
                            _sound_battery_charger.setPercent(0).play();
                        }

                        _self.showTeleport(_CLN_Rob[rIndex], true, false, true);

                        for (var team= _GET_TEAM_OF(rIndex), irob=team.length; irob--;)
                            _self.showTeleport(_CLN_Rob[team[irob]], true, false, true);
                    }
                }

            $($id).find("#battery-percent").html((value/10).toFixed(1) + "%");

            if (this.batteryWarning[rIndex] && value <= (_COLUMNS+_ROWS)*_BATTERY_WALK_COST){
                this.batteryWarning[rIndex] = false;

                if (_AUDIO_ENABLE){
                    var _voice = _sound_voice_battery_danger[random(_sound_voice_battery_danger.length)];
                    CallWithDelay.Enqueue(_voice.play, null, 2, _voice);
                }
                _batteryWarning(2);
            }

            if (value <= (_COLUMNS+_ROWS)*_BATTERY_WALK_COST)
                $($id).find("#battery-charge").css("background-color", "red");
            else{
                $($id).find("#battery-charge").css("background-color", "rgb("+(75+(180*(1-value/1000)|0))+", 218, 100)");
                this.batteryWarning[rIndex] = true;
            }

            if (value <= 0)
                $($id).find("#battery-charge").width("0%");
            else
                $($id).find("#battery-charge").stop(true).animate({width:value/10 + "%"},300);
        }

        this.batteryChargeAnimation = function(rIndex, bcIndex, out, bad){
            rIndex = _GET_TEAM_LEADER(rIndex);
            if (out){
                $("#rob-"+rIndex).find("#battery-charge-frame").css("box-shadow", "0 0 10px rgba(87, 255, 168, 0.57)");
                _CLN_BatteryElect[bcIndex].Scale.Y = 3;
            }else{
                $("#rob-"+rIndex).find("#battery-charge-frame").css("box-shadow", "0 0 40px rgba(87, 255, 168, 1)");

                _CLN_BatteryElect[bcIndex].setCurrentFrame(0);
                _CLN_BatteryElect[bcIndex].Scale.Y = 5.8;

                if (bad)
                    _self.showTeleport(_CLN_BatteryElect[bcIndex], true, true,true);
            }
        }

        //------------------------------------------------------------------------------------------------------------------------> newTile
        this.newTile = function(tileCell){
            var _CLN_Tile = _CL_Scene.getSceneNodeFromName('tile').createClone(_CL_Scene.getSceneNodeFromName('dummy-tile'));
            this.removeTile(tileCell);

            _CL_Floor[tileCell[0]][tileCell[1]][0].Visible = true;
            _CL_Floor[tileCell[0]][tileCell[1]][1].Visible = true;

            _CL_OnTheFloor[tileCell[0]][tileCell[1]] = _CLN_Tile;
            _CLN_Tile.Pos.X = GraphicTWorld.RowIndexToXPosition(tileCell[0]);
            _CLN_Tile.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(tileCell[1]);
            _CLN_Tile.setVisible(true);

            this.showTeleport(_CLN_Tile, true);
        }

        //------------------------------------------------------------------------------------------------------------------------> removeTile
        this.removeTile = function(tileCell, destroyedByLaser){
            var _CL_Tile;

            if (tileCell[0] >= 0 && tileCell[1] >= 0){

                _CL_Tile = _CL_OnTheFloor[tileCell[0]][tileCell[1]];

                if (_CL_Tile && destroyedByLaser) {
                    _CL_Tile.setVisible(false);
                    _CL_Tile.Pos.Y = 12;

                    _CLN_UFO.Stop = true;
                    laser = new CL3D.LaserBeam(
                        _CL_Tile.Pos,
                        _CLN_UFO.Pos,
                        _CL_Engine,
                        _LaserBeamLifeTime/2
                    );

                    _CL_LaserBeams.push(laser);

                    showExplosion(_CL_Tile.Pos);
                }

                _CL_Scene.getSceneNodeFromName('dummy-tile').removeChild(_CL_Tile);
                _CL_OnTheFloor[tileCell[0]][tileCell[1]] = null;
            }
        }

        //------------------------------------------------------------------------------------------------------------------------> newHole
        this.newHole = function(holeCells){
            var r = Math.random();
            var g = Math.random();
            var b = Math.random();
            var parent = _CL_Scene.getSceneNodeFromName('layer1');

            for (var i = holeCells.getLength(), laser, row, column; i--;){
                row = holeCells.getItemAt(i)[0];
                column = holeCells.getItemAt(i)[1];
                _CL_Floor[row][column][0].Visible = false;
                _CL_Floor[row][column][1].setVisible(false);

                if (_CL_HoleHelpers[row][column])
                    parent.removeChild(_CL_HoleHelpers[row][column]);

                _CL_HoleHelpers[row][column] = new CL3D.HoleCellHelper(0,0.2,0,_FloorCellSize,_CL_Engine, r, g, b, _HoleCellAlpha);
                _CL_HoleHelpers[row][column].Pos.X = GraphicTWorld.RowIndexToXPosition(row);
                _CL_HoleHelpers[row][column].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(column);
                _CL_HoleHelpers[row][column].setVisible(_SHOW_HOLES_HELPERS);

                parent.addChild(_CL_HoleHelpers[row][column]);

                //laser beams
                _CLN_UFO.Stop = true;
                laser = new CL3D.LaserBeam(
                    _CL_Floor[row][column][1].Pos,
                    _CLN_UFO.Pos,
                    _CL_Engine,
                    _LaserBeamLifeTime/2
                );

                _CL_LaserBeams.push(laser);

                showExplosion(_CL_HoleHelpers[row][column].Pos);
            }
        }

        //------------------------------------------------------------------------------------------------------------------------> removeHoleCell
        this.removeHoleCell = function(holeCell, isTeleported){
            var _CLN_FloorCell = _CL_Floor[ holeCell[0] ][ holeCell[1] ];
            var rc = holeCell;

            _CLN_FloorCell[0].Visible = true && (!_LOW_QUALITY_GRID || (rc[0] == 0 || rc[0] == _ROWS-1 || rc[1] == 0 || rc[1] == _COLUMNS-1));
            _CLN_FloorCell[1].setVisible(true);

            if (isTeleported){
                _CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp_bad.png", true);
                this.showTeleport(_CLN_FloorCell, false, 1);
            }
        }

        this.removeHoleHelper = function(holeCell){
            var _CLN_FloorCell = _CL_Floor[ holeCell[0] ][ holeCell[1] ];

            _CL_Scene.getSceneNodeFromName('layer1').removeChild(_CL_HoleHelpers[ holeCell[0] ][ holeCell[1] ]);
            _CL_HoleHelpers[ holeCell[0] ][ holeCell[1] ] = null;

            if (_CLN_FloorCell[1].getMaterial(0).Tex1 == _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true))
                _CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_diffuse_map.png", true);
        }

        //------------------------------------------------------------------------------------------------------------------------> newObstacle
        this.newObstacle = function(obstacleCell){
            var _CLN_FloorCell = _CL_Floor[obstacleCell[0]][obstacleCell[1]];
            var _CLN_Elect = _CL_Scene.getSceneNodeFromName('obstacle').createClone(_CL_Scene.getSceneNodeFromName('dummy'));
            var laser;

            _CLN_Elect.setVisible(true);
            _CLN_Elect.Pos.X = GraphicTWorld.RowIndexToXPosition(obstacleCell[0]);
            _CLN_Elect.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(obstacleCell[1]);
            _CLN_Elect.Rot.Y = to180Degrees(random(0, 360));
            _CLN_Elect.setCurrentFrame(Math.random()*_CLN_Elect.getNamedAnimationInfo(0).End);

            _CL_OnTheFloor[obstacleCell[0]][obstacleCell[1]] = _CLN_Elect;

            _CLN_FloorCell[0].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_broken_diffuse_map.png", true);
            _CLN_FloorCell[0].getMaterial(1).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonocore-red.png", true);
            _CLN_FloorCell[1].getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
            _CLN_FloorCell[1].getMaterial(0).Tex1 = _CLN_FloorCell[0].getMaterial(0).Tex1;


            if (Math.random() <= .5)
                _CLN_FloorCell[1].Rot.Y -= 180;

            //laser beams
            _CLN_UFO.Stop = true;
            laser = new CL3D.LaserBeam(
                _CLN_FloorCell[1].Pos,
                _CLN_UFO.Pos,
                _CL_Engine,
                _LaserBeamLifeTime
            );

            if (_AUDIO_ENABLE)
                _sound_ufo_laser.setPercent(0).play();
            _CL_LaserBeams.push(laser);
        }

        //------------------------------------------------------------------------------------------------------------------------> removeObstacle
        this.removeObstacle = function(cell){
            var _CLN_FloorCell = _CL_Floor[cell[0]][cell[1]];

            _CL_Scene.getSceneNodeFromName('dummy').removeChild(_CL_OnTheFloor[cell[0]][cell[1]]);
            _CL_OnTheFloor[cell[0]][cell[1]] = null;

            _CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
            _CLN_FloorCell[1].getMaterial(0).Type = CL3D.Material.EMT_SOLID;
            _CLN_FloorCell[0].getMaterial(0).Tex1 = _CLN_FloorCell[1].getMaterial(0).Tex1;

            this.showTeleport(_CLN_FloorCell, false);
        }

        //------------------------------------------------------------------------------------------------------------------------> fillHole
        this.fillHole = function(rIndex, direction, holeCell){

            var CL_Tile = _CL_OnTheFloor[holeCell[0]][holeCell[1]];

            this.Environment.getListOfTilesToSlide(rIndex).remove(holeCell[0], holeCell[1]);

            if (CL_Tile){
                CL_Tile.setMinimalUpdateDelay(_MINIMAL_UPDATE_DELAY);

                CL_Tile.setLoopMode(false);
                CL_Tile.setAnimation('fill');

                switch(direction){
                    case _ACTION.NORTH: CL_Tile.Rot.Y = -90;break;
                    case _ACTION.SOUTH: CL_Tile.Rot.Y =  90;break;
                    case _ACTION.EAST : CL_Tile.Rot.Y =   0;break;
                    case _ACTION.WEST : CL_Tile.Rot.Y = 180;
                }

                CL_Tile.CL_FloorCell = _CL_Floor[holeCell[0]][holeCell[1]];
                CL_Tile.CellToBeFilled = holeCell;
                CL_Tile.RobIndex = rIndex;
                CL_Tile.OriginalOnAnimate = CL_Tile.OnAnimate;
                CL_Tile.OnAnimate = CL_Tile_OnAnimate;
            }
        }

        //------------------------------------------------------------------------------------------------------------------------> holeFilled
        // Used only when _EASY_MODE is enabled
        this.holeFilled = function(rIndex, row, column){
            floorCell = _CL_Floor[row][column];
            floorCell[0].setVisible(
                true &&
                (
                    !_LOW_QUALITY_GRID ||
                    (
                        row == 0 || row == _ROWS-1 ||
                        column == 0 || column == _COLUMNS-1
                    )
                )
            );
            floorCell[1].setVisible(true);

            if ( !_self.Environment.isAObstacle(row, column) &&
                !_self.Environment.getHoleBeingFilled(rIndex).wasRemoved())
            {
                floorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
            }

            createHoleFilledAnimationLight(rIndex);

            _self.Environment.holeFilled(rIndex);
        }
    //end region Public
    //
    //region private
        //this function contains all the code for the logic to generate the next frame to be displayed,
        //and it's obviously executed each frame
        //------------------------------------------------------------------------------------------------------------> display
        //since this function runs at every frame the code within it must be efficient, that is why
        //I'm gonna cache all hashed variables:
        var _robPosX, _robPosZ, _robRotY;
        var _ufoPosX, _ufoPosY, _ufoPosZ;
        var headRotY=0, headRotX=155, headCenter = new CL3D.Vect3d(0,20,0);
        var _cameraPos;
        var $fps = $("#fps");
        var tmp;
        var oldYMouse=0, oldXMouse=0, fixedHeadRotY=0;
        var timeElapsed;
        function display(CL_Scene, currentTime) {
            if (!_oldCurrentTime)
                timeElapsed = 0;
            else
                timeElapsed = currentTime - _oldCurrentTime;

            //caching hashed values
            _robPosX = _CLN_Rob[0].Pos.X;
            _robPosZ = _CLN_Rob[0].Pos.Z;
            _ufoPosX = _CLN_UFO.Pos.X;
            _ufoPosY = _CLN_UFO.Pos.Y;
            _ufoPosZ = _CLN_UFO.Pos.Z;

            //Rob's animation
            var rob = _NUMBER_OF_AGENTS;
            while (rob--)
                _self.Rob[rob].animate(timeElapsed);

            //UFO animation
            ShipFlyCircle();

            //Camera animation
            if (_cameraFirtPerson){
                _robRotY= _CLN_Rob[0].Rot.Y;

                tmp = headRotY*_DEG_PI;
                var cosQ = Math.cos(tmp);
                var sinQ = Math.sin(tmp);
                tmp = headRotX*_DEG_PI;
                var cosO = Math.cos(tmp);
                var sinO = Math.sin(tmp);

                if (_self.Rob[0].isWalking()){
                    tmp = Math.cos(currentTime/50);
                    headCenter.set(2 + tmp*.7, 21 + tmp*0.3, 2 + tmp*.7);
                }else
                    headCenter.set(0, 20, 0);

                _CLN_UFO.Rot.Y = CL3D.radToDeg(Math.atan2(_ufoPosX- _CLN_FloorBase.Pos.X, _ufoPosZ - _CLN_FloorBase.Pos.Z));


                //Spherical coordinate system
                _cameraPos.Z = (6+headCenter.Z)*sinO*cosQ + _robPosZ;
                _cameraPos.X = (6+headCenter.X)*sinO*sinQ + _robPosX;
                _cameraPos.Y = 4*cosO + headCenter.Y + 0.03*(_ufoPosY - _UFOFlyCenter.Y);

                //Spherical coordinate system
                _CL_ActiveCameraTarget.Z = 20*sinO*cosQ + _robPosZ;
                _CL_ActiveCameraTarget.X = 20*sinO*sinQ + _robPosX;
                _CL_ActiveCameraTarget.Y = 20*cosO + headCenter.Y;

                if (_CL_CursorControl.MouseIsDown){

                    tmp = (_CL_CursorControl.MouseY - oldYMouse)/3;
                    if (10 < headRotX + tmp && headRotX + tmp < 162)
                        headRotX += tmp;

                    tmp = (_CL_CursorControl.MouseX - oldXMouse)/3;
                    if (RelativeAngleBetween(_robRotY, headRotY+tmp) > 88)
                        headRotY = Relative180Angle(_robRotY, 88);
                    else
                    if (RelativeAngleBetween(_robRotY, headRotY+tmp) < -88)
                        headRotY = Relative180Angle(_robRotY, -88);
                    else
                        headRotY += tmp;

                    fixedHeadRotY = 0;
                }else{
                    if (!fixedHeadRotY)
                        fixedHeadRotY = headRotY - _robRotY;
                    else
                        headRotY = _robRotY + fixedHeadRotY;
                }

                oldYMouse = _CL_CursorControl.MouseY;
                oldXMouse = _CL_CursorControl.MouseX;
            }else{
                _CLN_UFO.Rot.Y = CL3D.radToDeg(Math.atan2(_ufoPosX- _robPosX, _ufoPosZ - _robPosZ));

                if (_cameraAnimationFlag){
                    var r;
                    if (_cameraAnimationFlag == 1){
                        var xt = (_cameraTargetFinalPos.X - _CL_ActiveCameraTarget.X);
                        var yt = (_cameraTargetFinalPos.Y - _CL_ActiveCameraTarget.Y);
                        var zt = (_cameraTargetFinalPos.Z - _CL_ActiveCameraTarget.Z);
                        var x = (_cameraFinalPos.X - _cameraPos.X);
                        var y = (_cameraFinalPos.Y - _cameraPos.Y);
                        var z = (_cameraFinalPos.Z - _cameraPos.Z);
                        

                        if (Math.abs(xt)+Math.abs(yt)+Math.abs(zt) < 1){
                            _CL_ActiveCameraTarget.X = _cameraTargetFinalPos.X;
                            _CL_ActiveCameraTarget.Y = _cameraTargetFinalPos.Y;
                            _CL_ActiveCameraTarget.Z = _cameraTargetFinalPos.Z;
                        }else{
                            _CL_ActiveCameraTarget.X += xt/_AnimationFactor;
                            _CL_ActiveCameraTarget.Y += yt/_AnimationFactor;
                            _CL_ActiveCameraTarget.Z += zt/_AnimationFactor;
                        }

                        if (Math.abs(x)+Math.abs(y)+Math.abs(z) < 1){
                            _cameraPos.X = _cameraFinalPos.X;
                            _cameraPos.Y = _cameraFinalPos.Y;
                            _cameraPos.Z = _cameraFinalPos.Z;
                        }else{
                            _cameraPos.X += x/_AnimationFactor;
                            _cameraPos.Y += y/_AnimationFactor;
                            _cameraPos.Z += z/_AnimationFactor;
                        }

                        if (xt+yt+zt+x+y+z == 0){
                            _cameraReadyFlag = !(_cameraAnimationFlag = 0);

                            if (_ACTIVE_CAMERA == _CAMERA_TYPE.FIRST_PERSON){
                                $("#frameColor")
                                    .css({opacity: 1 , 'background-color' : 'rgb(6, 16, 23)'})
                                    .show()
                                    .stop(true).animate({opacity:0}, 1000, function(){$("#frameColor").hide();});
                                $("#frameShadow")
                                    .css("background", "url('imgs/shadow_frame_rob.png') no-repeat")
                                    .css("background-size", "100% 100%");

                                //hidding the head
                                for (var i=36;i<=44;i++){
                                    _CLN_Rob[0].getMaterial(i).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/transp.png", true);
                                    _CLN_Rob[0].getMaterial(i).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
                                }

                                headRotY = _CLN_Rob[0].Rot.Y;

                                _cameraPos.Y = 20;
                                _CL_ActiveCameraTarget.Y = -30;

                                _cameraFirtPerson = true;
                            }
                        }
                    }

                    if (_CL_ActiveCamera.Animators[0]){
                        r = (_cameraFinalRadius - _CL_ActiveCamera.Animators[0].Radius);
                        if (Math.abs(r)+((_cameraAnimationFlag == 1)? Math.abs(yt) : 0) < 0.3){
                            _CL_ActiveCamera.Animators[0].Radius = _cameraFinalRadius;
                            _cameraReadyFlag = !(_cameraAnimationFlag = 0);
                        }else
                            _CL_ActiveCamera.Animators[0].Radius += r/_AnimationFactor;
                    }
                }

                if (_ACTIVE_CAMERA == _CAMERA_TYPE.UFO)
                    if (!_cameraAnimationFlag){
                        _cameraPos.setTo(_CLN_UFO.Pos);
                        _cameraPos.Y += 1;
                    }else{
                        _cameraFinalPos.setTo(_CLN_UFO.Pos);
                        _cameraFinalPos.Y += 3.6;
                    }

                if (_FollowRob){
                    if (_CAMERA_SMOOTH){
                        _cameraXPosOffset = (_robPosX - _CL_ActiveCameraTarget.X)/30;
                        _cameraZPosOffset = (_robPosZ - _CL_ActiveCameraTarget.Z)/30;

                        if (Math.abs(_cameraXPosOffset) > 0.05){
                            if (_ACTIVE_CAMERA == _CAMERA_TYPE.AROUND_ROB)
                                _cameraPos.X += _cameraXPosOffset;
                            _CL_ActiveCameraTarget.X += _cameraXPosOffset;
                        }

                        if (Math.abs(_cameraZPosOffset) > 0.05){
                            if (_ACTIVE_CAMERA == _CAMERA_TYPE.AROUND_ROB)
                                _cameraPos.Z += _cameraZPosOffset;
                            _CL_ActiveCameraTarget.Z += _cameraZPosOffset;
                        }
                    }else{
                        _CL_ActiveCameraTarget.X = _robPosX;
                        _CL_ActiveCameraTarget.Z = _robPosZ;
                    }
                }

                if (_cameraShakingFlag && _CL_CameraModelViewer.CursorControl.isMouseDown())
                    _cameraShakingFlag = false;

                if (!_cameraAnimationFlag){
                    if (!_cameraShakingFlag && !CL3D.equals(_cameraPos.Y,_cameraFixedPosY)){
                        _cameraFixedPosY = _cameraPos.Y;
                        _cameraShakingOrg = _ufoPosY - _UFOFlyCenter.Y;
                    }else{
                        _cameraPos.Y = _cameraFixedPosY + /*(4/15)*/0.26*((_ufoPosY - _UFOFlyCenter.Y) - _cameraShakingOrg);
                        _cameraShakingFlag = true;
                    }
                }
            }

            //pause animation

            if (_PAUSE_ENABLED && _SPEED != _targetSpeed){

                if (Math.abs(_targetSpeed - _SPEED) < 0.05){
                    _SPEED = _targetSpeed;
                }else{
                    _SPEED += (_targetSpeed - _SPEED)/15;

                }
            }

            //region laser beams animation
                if (_CL_LaserBeams.length == 0 && _CLN_LaserGlow.Visible){
                    if (_AUDIO_ENABLE)
                        _sound_ufo_laser.stop();

                    _CLN_LaserGlow.setVisible(false);
                    _CLN_UFO.Stop = false;
                }else
                    for (var i=_CL_LaserBeams.length; i--;){
                        if ((_CL_LaserBeams[i].LifeTime-=timeElapsed) <= 0){
                            _CL_LaserBeams[i].dispose();
                            _CL_LaserBeams.remove(i);
                        }
                    }
            //end region laser beams

            //region fps calculation
                if (_SHOW_FPS){
                    _FPSAvgCounter = (_FPSAvgCounter + 1)%120;

                    if (_FPSAvgCounter == 0){
                        _FPSAvgCounter = 1;
                        _FPSSum = _FPS/(timeElapsed*_FPS/1000)*_SPEED|0;
                    }else
                        _FPSSum += _FPS/(timeElapsed*_FPS/1000)*_SPEED|0;

                    $fps.html((_FPSSum/_FPSAvgCounter|0) + " fps");
                }
            //end region fps calculation

            //Asynchronous perception (if it is enabled)
            for (var irob= _NUMBER_OF_AGENTS; irob--;)
                if ((_AGENTS[irob].CONTROLLED_BY_AI) && (!_AGENTS[irob].PERCEPT.SYNC && _SPEED &&
                    (_perceptTimeAccum[irob]+= timeElapsed) >= _AGENTS[irob].PERCEPT.INTERVAL*_SPEED))
                {
                    _perceptTimeAccum[irob] = _perceptTimeAccum[irob] % _AGENTS[irob].PERCEPT.INTERVAL;
                    _self.Environment.programAgentPerceive(irob);
                }

            //every second let the environment know a second has passed...
            _oldCurrentTime = currentTime;
            _timeAccumulador+= timeElapsed;
            if (_timeAccumulador >= 1000){
                _timeAccumulador = _timeAccumulador % 1000;
                _self.Environment.tick();
            }


            //CL graphicEngine I let you do your stuff! (calling the original onAnimate function)
            _clOnAnimateCallBack.apply(this, [CL_Scene, currentTime]);
        }

        function _CLNs_setMinimalUpdateDelay(frames){
                _CL_Scene.getSceneNodeFromName('ufo').setMinimalUpdateDelay(frames);
                _CL_Scene.getSceneNodeFromName('astromaxi').setMinimalUpdateDelay(frames);
                _CL_Scene.getSceneNodeFromName('laserbeam-hit').setMinimalUpdateDelay(frames);
                _CL_Scene.getSceneNodeFromName('laserbeam-strong-hit').setMinimalUpdateDelay(frames);
                _CL_Scene.getSceneNodeFromName('tp-halo').setMinimalUpdateDelay(frames);
                _CL_Scene.getSceneNodeFromName('holefilled-light').setMinimalUpdateDelay(frames);

                for (var i=0; i < _NUMBER_OF_AGENTS; ++i)
                _self.Rob[i].setMinimalUpdateDelay(frames);
        }

        function _toggleOnScreenInfo(value, forced){
            if (this.Value != value){
                this.Value = value;
                if (forced || (!_Paused && _Running)){
                    if (value){
                        if (_AUDIO_ENABLE) _sound_beep.setPercent(0).play();
                        _GUI.ON_GAME_SCREEN.$.stop(true).animate({left:0}, 300, "easeOutElastic");
                    }else
                        _GUI.ON_GAME_SCREEN.$.stop(true).animate({left:_GUI.ON_GAME_SCREEN.LEFT}, 200);
                }
            }
        }

        function _toggleHolesHelpersVisible(value){
            //O(n^2)
            for (var irow= _CL_HoleHelpers.length; irow--;)
                for (var icolumn= _CL_HoleHelpers[0].length; icolumn-- ;)
                    if (_CL_HoleHelpers[irow][icolumn])
                        _CL_HoleHelpers[irow][icolumn].setVisible(value);
        }

        function _toggleVisibilityBounds(value){if (!TWorld.FullyObservableGrid){
            for (var i= _CL_VisibilityBox.length; i--;)
                _CL_VisibilityBox[i].setVisible(value);
        }}

        function _togglePause(){

            if (_PAUSE_ENABLED && _Running){
                _Paused = !_Paused;

                _self.Environment.togglePause();

                if (_Paused){
                    if (_AUDIO_ENABLE){
                        buzz.all().setVolume(0);
                        _sound_voice_pause.setPercent(0).setVolume(_VOLUME_LEVEL).play();
                        _sound_pause_on.setPercent(0).setVolume(_VOLUME_LEVEL).play();
                    }

                    _targetSpeed = 0;

                    $('#header').stop(true).animate({opacity: 0}, 500, function(){$(this).hide()});
                    $('#robs-hud').stop(true).animate({opacity: 0}, 500);
                    $('#time').stop(true).animate({opacity: 0}, 500, function(){$(this).hide()});
                    $('#playPauseBtn').show().removeClass("no-events");
                    $('#playPauseBtn').stop(true).animate({opacity:1}, 1000);
                    $("#frameColor")
                        .css({opacity: 0 , 'background-color' : 'green'})
                        .show()
                        .stop(true).animate({opacity:0.15}, 1000);
                    //$("#bs-mid").css("margin-top", (-$("#bs-mid").height()/2|0)+"px");*/
                    _toggleOnScreenInfo(true, true);
                }else{
                    _targetSpeed = _initialSpeed;

                    $("#header").show();
                    $('#header').stop(true).animate({opacity:1}, 1000);
                    $('#robs-hud').stop(true).animate({opacity:1}, 1000);
                    $("#time").show();
                    $('#time').stop(true).animate({opacity:1}, 1000);
                    $('#playPauseBtn').stop(true).animate({opacity: 0}, 500, function(){$(this).hide()});
                    $('#frameColor').stop(true).animate({opacity: 0}, 500, function(){$(this).hide()});

                    _toggleOnScreenInfo(false);

                    for (var r=0; r < _NUMBER_OF_AGENTS; ++r)
                    for (var i=0; i < 4; ++i)
                        _self.keyUp(r, i);

                    if (_AUDIO_ENABLE){
                        buzz.all().setVolume(_VOLUME_LEVEL);
                        _sound_pause_off.setPercent(0).setVolume(_VOLUME_LEVEL).play();
                    }
                }
            }
        }

        this.toggleCamera = function(){
            _ACTIVE_CAMERA = (_ACTIVE_CAMERA+1) % (Object.keys(_CAMERA_TYPE).length);
            _cameraAnimationFlag = 1;
            _AnimationFactor = 4;
            _FollowRob = false;
            _cameraReadyFlag = false;
            _cameraShakingFlag = false;
            _cameraFirtPerson = false;

            switch(_ACTIVE_CAMERA){
                case _CAMERA_TYPE.AROUND_GRID:
                    var offset = Math.max(_ROWS, _COLUMNS) > 6?
                                                Math.max(_ROWS, _COLUMNS)*_FloorCellSize :
                                                7*_FloorCellSize;
                    _cameraTargetFinalPos.setTo(_CLN_FloorBase.Pos);
                    _cameraTargetFinalPos.Y = 6;
                    _cameraFinalPos.set(-(offset-40), 50, offset/2);
                    _cameraFinalRadius = offset + 20;
                    _CL_CameraModelViewer.RotateSpeed = _cameraFinalRadius*6;
                    _CL_ActiveCamera.Animators.clear();
                    _CL_ActiveCamera.Animators.push(_CL_CameraModelViewer);
                    break;

                case _CAMERA_TYPE.AROUND_ROB:
                    _cameraTargetFinalPos.setTo(_CLN_Rob[0].Pos);
                    _cameraTargetFinalPos.Y = _CLN_Rob[0].getBoundingBox().getCenter().Y + 6;
                    _cameraFinalPos.setTo(_CL_ActiveCamera.Pos);
                    if (_cameraFinalPos.Y <= 0)
                        _cameraFinalPos.Y = 10;
                    _CL_CameraModelViewer.Radius = _CL_ActiveCamera.Animators[0].Radius;
                    _cameraFinalRadius = 100;
                    _CL_CameraModelViewer.RotateSpeed = _cameraFinalRadius*6;
                    _FollowRob = true;
                    _CL_ActiveCamera.Animators.clear();
                    _CL_ActiveCamera.Animators.push(_CL_CameraModelViewer);
                    break;

                case _CAMERA_TYPE.FIRST_PERSON:
                    var angle =  headRotY? headRotY : _CLN_Rob[0].Rot.Y;
                    var cosQ = Math.cos(angle*_DEG_PI);
                    var sinQ = Math.sin(angle*_DEG_PI);
                    var cosO = Math.cos(headRotX*_DEG_PI);
                    var sinO = Math.sin(headRotX*_DEG_PI);

                    //Spherical coordinate system
                    _cameraTargetFinalPos.X = 20*sinO*sinQ + _CLN_Rob[0].Pos.X;
                    _cameraTargetFinalPos.Z = 20*sinO*cosQ + _CLN_Rob[0].Pos.Z;
                    _cameraTargetFinalPos.Y = 20*cosO + headCenter.Y;

                    //Spherical coordinate system
                    _cameraFinalPos.X = 6*sinO*sinQ + _CLN_Rob[0].Pos.X;
                    _cameraFinalPos.Z = 6*sinO*cosQ + _CLN_Rob[0].Pos.Z;
                    _cameraFinalPos.Y = 4*cosO + headCenter.Y;

                    _CL_ActiveCamera.Animators.clear();
                    break;
                case _CAMERA_TYPE.PERCEPT:
                    $("#frameShadow")
                        .css("background", "url('imgs/shadow_frame.png') no-repeat")
                        .css("background-size", "100% 100%");

                    for (var i=36;i<=44;i++){
                        _CLN_Rob[0].getMaterial(i).Tex1 = _CL_Rob_Texturs[i];
                        if (_CL_Rob_Texturs[i].Name.indexOf("glow.png") == -1)
                            _CLN_Rob[0].getMaterial(i).Type = CL3D.Material.EMT_SOLID;
                    }

                    _cameraTargetFinalPos.setTo(_CLN_FloorBase.Pos);
                    _cameraFinalPos.setTo(_CLN_FloorBase.Pos);
                    _cameraFinalPos.Y = 125;
                    _cameraFinalPos.Z-= 0.1;
                    _cameraFinalPos.X+= 14;
                    _CL_ActiveCamera.Animators.clear();
                    break;

                case _CAMERA_TYPE.UFO:
                    _cameraFinalPos.setTo(_CLN_UFO.Pos);
                    _FollowRob = true;
                    _CL_ActiveCamera.Animators.clear();
                    break;

            }
        }

        function ShipFlyCircle() {
            if (!_CLN_UFO.Stop){
                if (!this.Time){
                    this.Time = 1;
                    this.VecU = new CL3D.Vect3d(-1,0,0);
                    this.VecV = new CL3D.Vect3d( 0,0,1);
                    this.VecT0 = new CL3D.Vect3d();
                    this.VecT1 = new CL3D.Vect3d();
                    _CLN_UFO.Pos.setTo(_UFOFlyCenter);
                }else
                    this.Time+=_SPEED;

                if(this.Time!=0){
                    var b=this.Time*_UFOFlySpeed;
                    var _RadiusVariation = 20;

                    this.VecT0.setTo(this.VecU).multiplyThisWithScal(Math.cos(b)).addToThis(this.VecT1.setTo(this.VecV).multiplyThisWithScal(Math.sin(b)));

                    this.VecT0.multiplyThisWithScal( _UFOFlyRadius + _RadiusVariation + Math.cos(this.Time/30)*_RadiusVariation);
                    _CLN_UFO.Pos.setTo(_UFOFlyCenter).addToThis(this.VecT0);

                    _CLN_UFO.Pos.Y = 60 + Math.sin(this.Time/50)*15;

                    if (TWorld.Battery)
                        for (var bc= _CLN_BatteryIcon.length; bc--;)
                            _CLN_BatteryIcon[bc].Pos.Y = _BatteryIconY + (_CLN_UFO.Pos.Y - 60)/8;
                }
            }
        }

        function showExplosion(pos) {
            var explosion = _CL_Scene.getSceneNodeFromName('laserbeam-strong-hit').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (garbage!!)

            if (_AUDIO_ENABLE)
                _sound_ufo_laser_short.setPercent(0).play();

            explosion.Pos = pos;
            explosion.Rot.Y = to180Degrees(random(0,360));
            explosion.setCurrentFrame(0);
            explosion.setLoopMode(true);
            explosion.setVisible(true);

            explosion.OriginalOnAnimate = explosion.OnAnimate;
            explosion.OnAnimate = CL_Explosion_OnAnimate;
        }

        this.showTeleport = function(node, isTile, isRed, isBattery) {
            var tpHalo= _CL_Scene.getSceneNodeFromName('tp-halo').createClone(_CL_Scene.getSceneNodeFromName('dummy-tile'));//TODO: could be improved (garbage!!) clone equals evil

            tpHalo.Pos.X = (isTile || isBattery)? node.Pos.X : node[1].Pos.X;
            tpHalo.Pos.Z = (isTile || isBattery)? node.Pos.Z : node[1].Pos.Z;

            if (!isTile && !isRed){
                tpHalo.Pos.Y = 2;
                tpHalo.Rot.X = 180;
                node[0].getMaterial(1).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonocore.png", true);
                node[0].getMaterial(1).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
            }

            if (isRed){
                tpHalo.Scale.Y = 4;

                tpHalo.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-halo_bad.png", true);
                tpHalo.getMaterial(1).Tex1 = tpHalo.getMaterial(0).Tex1;

                if (_AUDIO_ENABLE)
                    _sound_teleport_bad.play();
            }else
                if (_AUDIO_ENABLE)
                    if (isTile)
                        _sound_teleport_tile.play();
                    else
                    if (!isBattery)
                        _sound_teleport_good.play();

            tpHalo.setAnimation("halo");
            tpHalo.setCurrentFrame(0);
            tpHalo.Visible  = false;
            tpHalo.setVisible(true);
            if (isBattery || (Math.random() < 0.5 && isTile)){
                tpHalo.Scale.Y = 3.6;
                tpHalo.Pos.Y += 10.6;
                tpHalo.Rot.X = 180;

                if (isBattery){ 
                    tpHalo.setAnimationSpeed(60);

                    if (_AUDIO_ENABLE && isRed)
                        _sound_teleport_bad.setPercent(0).play();
                }
            }

            tpHalo.Node = node;
            tpHalo.IsTile = isTile;
            tpHalo.isBattery = isBattery;
            tpHalo.OriginalOnAnimate = tpHalo.OnAnimate;
            tpHalo.OnAnimate = CL_TPHalo_OnAnimate;
        }

        this.showHoleFilledLight = function(rIndex, pair /*[x,z]*/) {
            var light= _CL_Scene.getSceneNodeFromName('holefilled-light').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (Clone = garbage collection!!)
            var $scoreUp = $("#score-up-" + rIndex);
            var $rob = $("#rob-" + _GET_TEAM_LEADER(rIndex));
            var pos2d;

            if (_scoreAnimation[rIndex].Filled){
                light.Scale.Y = 2;
                var m = light.Materials.length;
                while (m--){
                    if (light.getMaterial(m).Tex1.Name.indexOf("green-glow") == -1)
                        light.getMaterial(m).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/spotlight_full_score.png", true);
                    else
                        light.getMaterial(m).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/green-glow_full_score.png", true);
                }
            }

            light.Pos.X = pair[0];
            light.Pos.Z = pair[1];

            light.setAnimation("shine");
            light.setCurrentFrame(0);
            light.setVisible(true);

            if (_scoreAnimation[rIndex].Points > 0 && _Running){
                pos2d = _CL_Engine.get2DPositionFrom3DPosition(light.Pos);
                $scoreUp.html(_scoreAnimation[rIndex].StrPoints);

                if (pos2d){
                    var parentWidth = _CL_Canvas.parentNode.clientWidth;//$(window).width();
                    var parentHeight = _CL_Canvas.parentNode.clientHeight;//$(window).height();
                    $scoreUp.css({
                        left: parseInt(pos2d.X*(parentWidth/_CL_Canvas.width))+'px', // x*(width/origWidth) to respect the x-scale (when window is resized)
                        top: parseInt(pos2d.Y*(parentHeight/_CL_Canvas.height))+'px',// y*(height/origHeight) to respect the y-scale (when window is resized)
                        'font-size':    $("#tworld").height()*0.15+'px',
                        'text-shadow':  '0 0 10px ' + (_scoreAnimation[rIndex].Filled? 'rgb(255, 113, 198)': 'rgb(255, 0, 201)'),
                        color:          _scoreAnimation[rIndex].Filled? 'rgb(255, 0, 204)': 'rgb(255, 105, 0)',
                        opacity:1
                    });
                }

                $scoreUp.show();
                $scoreUp.stop(true).animate(
                    {
                        left: ($rob.find("#score").offset().left-$("#tw-root").offset().left|0)+'px',
                        top: ($rob.find("#score").offset().top-$("#tw-root").offset().top|0)+'px',
                        fontSize: '30px'
                    },
                    1000,
                    function(){
                        $scoreUp.hide();
                        $rob.find("#score").stop(true).animate({fontSize : '50px'},100).animate({fontSize: '30px'},600);
                    }
                );
            }

            light.OriginalOnAnimate = light.OnAnimate;
            light.OnAnimate = CL_Light_OnAnimate;
        }

        function createHoleFilledAnimationLight(rIndex) {
            if (_AUDIO_ENABLE)
                if (_scoreAnimation[rIndex].Filled)
                    _sound_score_full_light.setPercent(0).play();
                else
                    _sound_score_light.setPercent(0).play();

            for (var i=_scoreAnimation[rIndex].HoleFilledCells.length; i--;)
                _self.showHoleFilledLight(rIndex, _scoreAnimation[rIndex].HoleFilledCells[i]);
        }

        function CL_Tile_OnAnimate(CL_Scene, current){
            if (this.getFrameNr() >= 177500){
                var rc = this.CellToBeFilled;
                _self.removeTile(this.CellToBeFilled);
                this.CL_FloorCell[0].setVisible(true && (!_LOW_QUALITY_GRID || (rc[0] == 0 || rc[0] == _ROWS-1 || rc[1] == 0 || rc[1] == _COLUMNS-1)) );
                this.CL_FloorCell[1].setVisible(true);

                if ( !_self.Environment.isAObstacle(this.CellToBeFilled[0], this.CellToBeFilled[1]) && !_self.Environment.getHoleBeingFilled(this.RobIndex).wasRemoved() ) {
                    this.CL_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
                }

                createHoleFilledAnimationLight(this.RobIndex);

                _self.Environment.holeFilled(this.RobIndex);
            }else{
                this.OriginalOnAnimate.apply(this, [CL_Scene, current]);
            }
        }

        function CL_Explosion_OnAnimate(CL_Scene, current) {
            if (this.getFrameNr() >= this.getNamedAnimationInfo(0).End - 10400)
                _CL_Scene.getRootSceneNode().removeChild(this);
            else
                this.OriginalOnAnimate.apply(this, [CL_Scene, current]);
        }

        function CL_TPHalo_OnAnimate(CL_Scene, current) {

            if (this.getFrameNr() >= this.getNamedAnimationInfo(0).End-1000){
                _CL_Scene.getSceneNodeFromName('dummy-tile').removeChild(this);

                if (!this.isBattery){
                    if (this.IsTile){
                        if (this.Node.getMaterial(1)){
                            this.Node.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map.png", true);
                            this.Node.getMaterial(1).Tex1 = this.Node.getMaterial(0).Tex1;
                            this.Node.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
                            this.Node.getMaterial(1).Type = CL3D.Material.EMT_SOLID;
                        }
                    }else{
                        this.Node[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_diffuse_map.png", true);
                        this.Node[1].getMaterial(0).Type = /*CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL*/CL3D.Material.EMT_SOLID;
                        this.Node[0].getMaterial(0).Tex1 = this.Node[1].getMaterial(0).Tex1;
                    }
                }
            }else
                this.OriginalOnAnimate.apply(this, [CL_Scene, current]);
        }

        function CL_Light_OnAnimate(CL_Scene, current) {

            if (this.getFrameNr() >= this.getNamedAnimationInfo(0).End-1000)
                _CL_Scene.getRootSceneNode().removeChild(this);
            else
                this.OriginalOnAnimate.apply(this, [CL_Scene, current]);
        }
    //end region private
//end region Methods
//
//region Class Constructor Logic -------------------------------------------------------------------------------------> GraphicTWorld Constructor Begin
    // (Once everything's loaded, let's pass to the creation of the whole 3D Scene)
    _CL_Engine.OnLoadingComplete = function(){
        var _CLN_FloorCellBase, _CLN_FloorCellTop, _CLN_Tile, _CLN_Tube;
        var _CLN_Moon, _CLN_Planet, _CLN_Sky, ufoLaserAim, ufoHud, lowQualityGrid;

        //_CL_Engine.ShowFPSCounter = true;
        _CL_Scene = _CL_Engine.getScene();

        if (!_CL_Scene)
            return;

        _CL_Scene.BackgroundColor = CL3D.createColor(255, 255, 255, 255);
        _CL_Scene.useCulling = true;

        //pre-loading some texture maps
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-halo_bad.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonocore-red.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/spotlight_full_score.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/floor-cell-luz-filled.jpg", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_diffuse_map.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp_bad.png", true);
        _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_broken_diffuse_map.png", true);
        _CL_Engine.getTextureManager().getTexture("./imgs/full_screen_enter.png", true);
        _CL_Engine.getTextureManager().getTexture("./imgs/shadow_frame_rob.png", true);
        _CL_Engine.getTextureManager().getTexture("./imgs/restart_enter.png", true);
        _CL_Engine.getTextureManager().getTexture("./imgs/camera_enter.png", true);
        _CL_Engine.getTextureManager().getTexture("./imgs/play_enter.png", true);

        //_CL_Scene.getSceneNodeFromName('clouds').getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/clouds_bottom.png", true)
        if (_LOW_QUALITY_WORLD){
            _CLN_Sky = _CL_Scene.getSceneNodeFromName('cielo');
            _CLN_Sky.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/default_white.png", true);
            for (var i= 1; i < 6; ++i)
                _CLN_Sky.getMaterial(i).Tex1 = _CLN_Sky.getMaterial(0).Tex1;
        }
        _CL_Scene.getSceneNodeFromName('clouds').Scale.set(5,5,5);
        _CL_Scene.getSceneNodeFromName('clouds').Visible = !_LOW_QUALITY_WORLD;

        _CLN_FloorCellBase = _CL_Scene.getSceneNodeFromName('floor-cell-base');
        _CLN_FloorCellTop = _CL_Scene.getSceneNodeFromName('floor-cell-top');
        _CLN_FloorCellBase.getMaterial(1).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;

        _CLN_S3AR = _CL_Scene.getSceneNodeFromName('s3-a4');
        _CLN_S3AR.Pos.Z +=  _COLUMNS*_FloorCellSize - 10*_FloorCellSize;
        _CLN_S3AR.Visible = !_LOW_QUALITY_WORLD;

        for (var cond, irow= 0; irow < _ROWS; irow++)
            for (var icolumn= 0; icolumn < _COLUMNS; icolumn++){
                cond = (irow == 0 || irow == _ROWS-1 || icolumn == 0 || icolumn == _COLUMNS-1);
                _CL_Floor[irow][icolumn] =  [
                                            cond||!_LOW_QUALITY_GRID? _CLN_FloorCellBase.createClone(_CL_Scene.getRootSceneNode()) : _CLN_FloorCellBase,
                                            _CLN_FloorCellTop.createClone(_CL_Scene.getRootSceneNode())
                                            ];
                _CL_Floor[irow][icolumn][0].Pos.X = _CL_Floor[irow][icolumn][1].Pos.X = GraphicTWorld.RowIndexToXPosition(irow);
                _CL_Floor[irow][icolumn][0].Pos.Z = _CL_Floor[irow][icolumn][1].Pos.Z = GraphicTWorld.ColumnIndexToZPosition(icolumn);

                _CL_Scene.getSceneNodeFromName('layer1').addChild(_CL_Floor[irow][icolumn][0]);
                _CL_Scene.getSceneNodeFromName('layer1').addChild(_CL_Floor[irow][icolumn][1]);
            }

        _CLN_FloorCellBase.Visible = false;
        _CLN_FloorCellTop.setVisible(false);

        _floorLimits.X0 = -(_ROWS)*_FloorCellSize/2;
        _floorLimits.X1 = (_ROWS-2)*_FloorCellSize/2;
        _floorLimits.Y0 = 0;
        _floorLimits.Y1 = _FloorCellSize*(_COLUMNS-1);

        _CLN_FloorBase = _CL_Scene.getSceneNodeFromName('floor-base');
        _CLN_FloorBase.Scale.X = _ROWS;
        _CLN_FloorBase.Scale.Z = _COLUMNS;
        _CLN_FloorBase.Pos.X = (_floorLimits.X0 + _floorLimits.X1)/2;
        _CLN_FloorBase.Pos.Z = (_floorLimits.Y0 + _floorLimits.Y1)/2;

        if (_LOW_QUALITY_GRID){
            _CLN_FloorBase.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/solar_panel_texture_lq.jpg", true);
            _CLN_FloorBase.Scale.Y = 1.5;
        }

        //Camera
        _CL_ActiveCamera = _CL_Scene.getActiveCamera();
        _CL_ActiveCamera.setFarValue(6000);
        _CL_ActiveCamera.setFov(1);
        _CL_ActiveCameraTarget = _CL_ActiveCamera.getTarget();
        _CL_ActiveCameraTarget.setTo(_CLN_FloorBase.Pos);
        _CL_CameraModelViewer = _CL_ActiveCamera.Animators[0];
        _CL_CameraModelViewer.SlidingSpeed = 1500;
        _CL_CameraFlyCircle.Radius = (Math.random() < 0.2 || _LOW_QUALITY_WORLD)? 60 : 1915;
        _CL_CameraFlyCircle.Speed = 0.0003;
        _CL_CameraFlyCircle.Center.setTo(_CLN_FloorBase.Pos);
        _CL_CameraFlyCircle.Center.Y += 30 + Math.random()*100;
        _CL_ActiveCamera.Animators.clear();
        _CL_ActiveCamera.Animators.push(_CL_CameraFlyCircle);
        _cameraFinalRadius = _CL_CameraFlyCircle.Radius;
        _cameraPos = _CL_ActiveCamera.Pos;

        _CL_CursorControl = _CL_CameraModelViewer.CursorControl;

        _CLN_LaserGlow = _CL_Scene.getSceneNodeFromName('laserbeam-light');
        _CLN_LaserGlow.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/laserbeam-ufo.png", true);

        _CLN_UFO = _CL_Scene.getSceneNodeFromName('ufo');
        _CLN_UFO.getMaterial(11).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/transp.png", true);
        _CLN_UFO.getMaterial(11).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
        _CLN_UFO.Rot.X = -30;
        _CLN_UFO.Stop = false;
        _UFOFlyCenter.setTo(_CLN_FloorBase.Pos);
        _UFOFlyRadius = Math.max(_ROWS, _COLUMNS-1)*_FloorCellSize/2;
        if (_UFOFlyRadius >= 80)
            _UFOFlyRadius = 80;

        ufoHud = _CL_Scene.getSceneNodeFromName('clouds').createClone();
        ufoHud.getMaterial(1).Tex1 = ufoHud.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/ufo_hud.jpg", true);
        ufoHud.getMaterial(1).Type = ufoHud.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
        ufoHud.getMaterial(2).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/black.png", true);
        ufoHud.getMaterial(2).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
        ufoHud.Scale.set(0.1,0.0,0.1);
        ufoHud.Pos.set(0, -20, -0);
        ufoHud.Rot.set(-10, 0, 0);
        ufoHud.Visible = true;

        ufoLaserAim = ufoHud.createClone();
        ufoLaserAim.getMaterial(1).Tex1 = ufoLaserAim.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/ufo_hud_red.jpg", true);
        ufoLaserAim.getMaterial(1).Type = ufoLaserAim.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
        ufoLaserAim.Scale.set(0.05,0.0,0.05);
        ufoLaserAim.Pos.set(0, -80, -50);
        ufoLaserAim.Rot.set(-45, 180, 0);
        ufoHud.setVisible(true);

        _CLN_UFO.addChild(ufoHud);
        _CLN_UFO.addChild(ufoLaserAim);
        _CL_Scene.getSceneNodeFromName('rob').getParent().addChild(_CLN_UFO);

        _CLN_Tile = _CL_Scene.getSceneNodeFromName('tile');
        _CLN_Tile.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
        _CLN_Tile.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
        _CLN_Tile.getMaterial(0).BackfaceCulling = true;
        _CLN_Tile.getMaterial(1).Tex1 = _CLN_Tile.getMaterial(0).Tex1;
        _CLN_Tile.getMaterial(1).Type = _CLN_Tile.getMaterial(0).Type;
        _CLN_Tile.Scale.X = _CLN_Tile.Scale.Z = 0.9;

        _CLN_Tube = _CL_Scene.getSceneNodeFromName('cylinder-solar-panel');
        _CLN_Tube.Pos.set(-5, -48, 0);
        _CLN_Tube.Scale.set(7.5, 1.8, 0.6);
        _CLN_Tube.Pos.Z = _CLN_FloorBase.Pos.Z + _COLUMNS*_FloorCellSize/2 + 45;
        _CLN_Tube.Pos.Y -= 1;
        _CLN_Tube.Rot.X = -60;
        _CLN_Tube.setVisible(!_LOW_QUALITY_WORLD);

        _CL_Scene.getSceneNodeFromName('tp-halo').setLoopMode(false);
        _CL_Scene.getSceneNodeFromName('holefilled-light').setLoopMode(false);

        ShipFlyCircle();

        _CLN_Moon = new CL3D.BillboardSceneNode();
        _CLN_Moon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/moon.png", true);
        _CLN_Moon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
        _CLN_Moon.SizeX = _CLN_Moon.SizeY = 4000;
        _CLN_Moon.Pos.set(-1200, 1600, 2100);
        _CL_Scene.getSceneNodeFromName('layer1').addChild(_CLN_Moon);

        _CLN_Planet = new CL3D.BillboardSceneNode();
        _CLN_Planet.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/planet.png", true);
        _CLN_Planet.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
        _CLN_Planet.SizeX = _CLN_Planet.SizeY = 700;
        _CLN_Planet.Pos.set(2200, 2400, -2100);
        _CL_Scene.getSceneNodeFromName('layer1').addChild(_CLN_Planet);

        _CL_Scene.getSceneNodeFromName('battery-charger-icon').setVisible(false);

        if (_FULL_WINDOW_RENDER)
            ToogleFullWindowRender(document.getElementById("tw-root"));

        for (rob= 0; rob < _NUMBER_OF_AGENTS; ++rob){
            if (rob == 0){
                _CLN_Rob[0] = _CL_Scene.getSceneNodeFromName('rob');

                //saving original textures used to hide/show in first person camera implementation
                for (var i=36;i<=44;i++)
                    _CL_Rob_Texturs[i] = _CLN_Rob[0].getMaterial(i).Tex1;
            }else
                _CLN_Rob[rob] = _CLN_Rob[0].createClone(_CLN_Rob[0].getParent());

            _CLN_Rob[rob].setVisible(true, true);
            _self.Rob[rob] = new GraphicRob(_CLN_Rob[rob], _self, rob);

            //Visibility bounds
            if (!TWorld.FullyObservableGrid){
                _CL_VisibilityBox[rob] = new CL3D.HoleCellHelper(0,0,0,_FloorCellSize,_CL_Engine, 0, 0, 0, 0.4);
                _CL_VisibilityBox[rob].Scale.set(TWorld.VisibilityRadius*2 + 1,0,TWorld.VisibilityRadius*2 + 1);
                _CL_VisibilityBox[rob].Pos.Y = 0.02*(rob+1);
                _CL_Scene.getRootSceneNode().addChild(_CL_VisibilityBox[rob]);
            }

            for (var iteam = _TEAMS.length; iteam--;)
                if (_TEAMS[iteam].MEMBERS[0] == rob){

                    $("#robs-hud").append(
                        '<span id="rob-'+rob+'" style="display: list-item; list-style-type: none; height: 36px; '+(TWorld.Battery?'padding: 13px 4px;':'padding-bottom: 10px; padding-right: 4px;')+'">'+
                            (_NUMBER_OF_AGENTS > 1? '<span id="tm-'+rob+'-logo"'+((_TEAMS[iteam].MEMBERS.length > 1)? 'class="rotate90"' :'')+' style="float: right; font-family: airstrike; margin-right: 13px; margin-top: -3px; height: 40px; width: 34px; font-size: 34px; background: url(\'./copperlichtdata/color-' + _TEAMS[iteam].COLOR + '.png\') no-repeat; background-size: contain; padding-right: 5px; text-align: center;">'+((_TEAMS[iteam].MEMBERS.length == 1)? rob : '')+'</span>':'')+
                            (TWorld.Battery? '<span id="battery-parent" style="float:right; margin: -3px 15px 0 -35px; text-shadow: 0px 0px 10px cyan;">'+
                                '<span style="float: right; margin-top: 13px; margin-right: -4px; width: 5px; height: 16px; background-color: rgba(255, 255, 255, 0.35); border-radius: 0 5px 5px 0;"></span>'+
                                '<span id="battery-charge-frame" style="overflow: hidden; float: right; margin-top: 6px; margin-right: 1px; width: 60px; height: 30px; background-color: rgba(255, 255, 255, 0.35); border-radius: 6px; box-shadow: 0 0 10px rgba(87, 255, 168, 0.57);">'+
                                    '<div id="battery-charge" style="background-color: rgb(76, 218, 100); background-image:url(imgs/battery-background.png); height:100%; width: 100%"></div>'+
                                '</span>'+
                                '<span id="battery-percent" class="rotate90" style="float: right; margin-top: 14px; font-size: 10px; text-shadow: 0 0 6px black;">100.0%</span>'+
                            '</span>' : '') +
                            '<span id="score-parent" style="float:right; font-size:20px; margin-right: '+(TWorld.Battery?'40px; margin-top: 10px':(_NUMBER_OF_AGENTS > 1?'5px':'20px'))+'; font-family: airstrike; text-shadow: 0px 0px 10px rgba(157, 248, 255, 0.66); color: rgb(255, 105, 0)">'+
                                'SCORE:&nbsp;<span id="score" style="font-size:30px; font-weight:bold;">0</span>'+
                            '</span>'+
                            '<span id="multiplier" style="float:right; font-size:20px; font-family: airstrike; text-shadow: 0px 0px 10px rgba(255, 0, 255, 0.66); color: rgb(255, 0, 255)">'+
                            '</span>'+
                        '</span>'
                    );
                }

                $("#frame").append(
                        '<div id="score-up-'+rob+'" class="no-selection element" style="pointer-events: none; display: none; position:absolute; z-index: 11; color: font-weight:bold; font-size:40px; font-family: airstrike">0</div>'
                    )

            _scoreAnimation[rob] = {
                Filled: false,
                Points: -1,
                StrPoints: "",
                HoleFilledCells: new Array()//for glowing light animation
            }
            
            _self.updateBattery(rob, _BATTERY_INITIAL_CHARGE);
        }//for

        //FINAL STATE CONDITIONS
        if (_ENDGAME.AGENTS_LOCATION.VALUE){
            var _LOCS = _ENDGAME.AGENTS_LOCATION.VALUE;
            var _RESULT = _ENDGAME.AGENTS_LOCATION.RESULT;
            var _CLN_Flag = _CL_Scene.getSceneNodeFromName('battery-charger-icon').createClone(_CL_Scene.getRootSceneNode());
            _CLN_Flag.setVisible(true);
            _CLN_Flag.getMaterial(0).Tex1 = _CL_Engine
                                                .getTextureManager()
                                                .getTexture(
                                                    "./copperlichtdata/flag-mark-"+(_RESULT == 2?"red":"green")+".png",
                                                     true
                                                );
            _CLN_Flag.Pos.X = GraphicTWorld.RowIndexToXPosition(_LOCS[0].row);
            _CLN_Flag.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(_LOCS[0].column);
            _CLN_Flag.Pos.Y = 8;

            for (var l = _LOCS.length-1; l>=1;--l){
                _CLN_Flag = _CLN_Flag.createClone(_CL_Scene.getRootSceneNode())
                _CLN_Flag.Pos.X = GraphicTWorld.RowIndexToXPosition(_LOCS[l].row);
                _CLN_Flag.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(_LOCS[l].column);
            }

            _CLN_Flag = _CL_Scene.getSceneNodeFromName('clouds').createClone(_CL_Scene.getRootSceneNode());
            _CLN_Flag.getMaterial(1).Type = _CLN_Flag.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
            _CLN_Flag.getMaterial(2).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/black.png", true);
            _CLN_Flag.getMaterial(2).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
            _CLN_Flag.getMaterial(1).Tex1 =
            _CLN_Flag.getMaterial(0).Tex1 = _CL_Engine
                                                    .getTextureManager()
                                                    .getTexture(
                                                        "./copperlichtdata/flag-mark-"+(_RESULT == 2?"red":"green")+"-glow.png",
                                                         true
                                                    );
            _CLN_Flag.Scale.set(0.02,0.0,0.02);
            _CLN_Flag.Pos.X = GraphicTWorld.RowIndexToXPosition(_LOCS[0].row);
            _CLN_Flag.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(_LOCS[0].column);
            _CLN_Flag.Pos.Y = 1.4;
            _CLN_Flag.Rot.set(0, 90, 0);
            _CLN_Flag.setVisible(true, true);

            for (var l = _LOCS.length-1; l>=1;--l){
                _CLN_Flag = _CLN_Flag.createClone(_CL_Scene.getRootSceneNode())
                _CLN_Flag.Pos.X = GraphicTWorld.RowIndexToXPosition(_LOCS[l].row);
                _CLN_Flag.Pos.Z = GraphicTWorld.ColumnIndexToZPosition(_LOCS[l].column);
                _CLN_Flag.setVisible(true, true);
            }
        }

        var wonC=[], lostC=[], $goalsTable = $("#table-goals");
        for (cond in _ENDGAME)
            if (_ENDGAME[cond].VALUE && _ENDGAME[cond].RESULT == _GAME_RESULT.SUCCESS)
                wonC.push(cond);
            else
            if (_ENDGAME[cond].VALUE && _ENDGAME[cond].RESULT == _GAME_RESULT.FAILURE)
                lostC.push(cond);

        for (var list, img, title, color, type= 0; type < 2; ++type){
            switch(type){
                case 0:
                    list = wonC;
                    img = "goal.png";
                    title = "Goals:";
                    color = "rgb(0, 255, 72)";
                    break;
                case 1:
                    list = lostC;
                    img = "go-mark.png";
                    title = "Failure conditions:";
                    color = "rgb(255, 8, 37)";
                    break;
            }
            if (list.length > 0){
                $goalsTable.append('<tr><th></th><th style="color: '+color+';">'+title+'</th></tr>');
                for (var desc, value, c= 0; c < list.length; ++c){
                    desc = '<tr><td><img id="'+_ENDGAME[list[c]].$ID+'" src="imgs/'+img+'"/></td><td>';
                    switch(list[c]){
                        case "TIME":
                            value = ToMMSS(_ENDGAME[list[c]].VALUE);
                            break;
                        case "AGENTS_LOCATION":
                            var robFinalLocs = _ENDGAME[list[c]].VALUE;
                            if (robFinalLocs.length)
                                value = sprintf("(%s,%s)", robFinalLocs[0].row, robFinalLocs[0].column);

                            for (var i= 1; i < robFinalLocs.length ; ++i)
                                value += sprintf(", (%s,%s)", robFinalLocs[i].row, robFinalLocs[i].column);

                            desc+= sprintf(
                                (robFinalLocs.length == 1)?
                                    _ENDGAME[list[c]].$TEXT.SINGULAR
                                    :
                                    _ENDGAME[list[c]].$TEXT.PLURAL,
                                    value
                            );
                            value= "AGENTS_LOCATION";
                            break;
                        case "BATTERY_USED":
                            value = _ENDGAME[list[c]].VALUE/10 + "%";
                            break;
                        default:
                            value = _ENDGAME[list[c]].VALUE;
                    }
                    if (value != "AGENTS_LOCATION")
                        desc+= sprintf(
                                (
                                    (parseInt(value) == 1)?
                                    _ENDGAME[list[c]].$TEXT.SINGULAR:
                                    _ENDGAME[list[c]].$TEXT.PLURAL
                                ),
                                value
                            );
                    $goalsTable.append(desc + "</td></tr>");
                }
                $goalsTable.append('<tr style="height:10px"><td></td><td></td></tr>');
            }
        }

        if (lostC.length + wonC.length > 0)
            $("#playPauseBtn").css("left", $("#table-goals").width()+"px").css("margin-left", "0");

        if (_NUMBER_OF_AGENTS > 1)
            for (var backIcon, teamIcon, playerIcon, rob= 0; rob < _NUMBER_OF_AGENTS; ++rob){
                backIcon = new CL3D.BillboardSceneNode();
                backIcon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-background.png", true);
                backIcon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
                backIcon.SizeX = backIcon.SizeY = 8;
                backIcon.Pos.set(0, 28, 0);

                teamIcon = new CL3D.BillboardSceneNode();
                teamIcon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/color-" + _TEAMS[_GET_TEAM_INDEX_OF(rob)].COLOR + ".png", true);
                teamIcon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
                teamIcon.SizeX = teamIcon.SizeY = 4;
                teamIcon.Pos.set(0, 28, 0);

                playerIcon = new CL3D.BillboardSceneNode();
                playerIcon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/p" + rob%10 + ".png", true);
                playerIcon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
                playerIcon.SizeX = playerIcon.SizeY = 4;
                playerIcon.Pos.set(0, 28, 0);

                _CLN_Rob[rob].addChild(playerIcon);
                _CLN_Rob[rob].addChild(backIcon);
                _CLN_Rob[rob].addChild(teamIcon);
            }

        //console messages
        if (!TWorld.FullyObservableGrid)
            console.log("Press <SPACE BAR> to show/hide agent's visibility bounds.");
        if (wonC.length || lostC.length)
            console.log("Press and hold <SHIFT> to see goals and failure conditions.");

        _toggleVisibilityBounds(_SHOW_VISIBILITY_BOUNDS);
        _clOnAnimateCallBack = _CL_Scene.getRootSceneNode().OnAnimate;
        _CL_Scene.getRootSceneNode().OnAnimate = display;
        _CLNs_setMinimalUpdateDelay(_MINIMAL_UPDATE_DELAY);

        //region User Input Handler

        //Reset Button
        $("#resetBtn").mouseenter(function(e){
            $("#resetBtn").prop("src", "imgs/restart_enter.png");
        });
        $("#resetBtn").mouseleave(function(e){
            $("#resetBtn").prop("src", "imgs/restart.png");
        });
        $("#resetBtn").mouseup(function(e){
            location.reload();
        });

        //Play Button
        $("#playBtn").mouseenter(function(e){
            $(this).prop("src", (!_LOW_QUALITY_WORLD)? "imgs/play_enter.png" : "imgs/play_enter_inv.png");
        });
        $("#playBtn").mouseleave(function(e){$(this).prop("src",  (!_LOW_QUALITY_WORLD)? "imgs/play.png" : "imgs/play_inv.png")});
        $("#playBtn").mouseleave();
        $("#playBtn").mouseup(function(e){

            if (!_Running){

                $('#tworld').removeClass("blur");
                $('#playBtn').hide();
                $('#frameShadow').css({'background-color':'transparent', 'pointer-events':'none'});


                $("#header").show();
                $("#header").animate({opacity:1},1000);
                $(".title").animate({opacity:0},1000,function(){$(".title").hide()});
                $("#pie").css("background-color", "transparent");

                $("#logos-line").css({border:'none'});
                $("#sb-logo").mouseleave();
                $("#unsl-logo").mouseleave();
                $("#pie-derecho").animate(
                    {opacity:0},
                    500,
                    function(){
                        $("#pie-derecho").hide();
                        $("#robs-hud").show();
                        $("#robs-hud").animate({opacity:1},1000);
                    }
                );

                _START_TIME = Date.now();
                $("#playFrame").remove();
                console.clear();
                _TWorld.start();
            }
        });

        //Logos
        $("#sb-logo").mouseenter(function(e){
            $("#sb-logo").stop(true).animate({width:'119px', opacity: 1}, 100);
        });
        $("#sb-logo").mouseleave(function(e){
            $("#sb-logo").stop(true).animate({width:'36px', opacity: 0.2}, 500);
        });

        $("#unsl-logo").mouseenter(function(e){
            $("#unsl-logo").stop(true).animate({width:'107px', opacity: 1}, 100);
        });
        $("#unsl-logo").mouseleave(function(e){
            $("#unsl-logo").stop(true).animate({width:'30px', opacity: 0.2}, 500);
        });

        $("#frameColor").hide();
        $("#score-up").hide();
        $(window).resize();

        if (!_SHOW_FPS)
            $("#fps").hide();

        $("#frame").show();
        $("#frame").animate({opacity : 1}, 4000, function(){$("tw-root").removeClass("body-background");});

        $("#loading-shadow").animate({opacity: 0}, 4000, function(){$("#loading-shadow").remove()});
        $("#loading").animate({opacity : 0}, 4000, function(){$("#loading").remove()});

        //$("#sb-logo").mouseleave();
        $("#unsl-logo").mouseleave();

        //Pause Button
        if (_PAUSE_ENABLED){
            $("#pauseBtn").mouseenter(function(e){$(this).prop("src", "imgs/pause_enter.png")});
            $("#pauseBtn").mouseleave(function(e){$(this).prop("src", "imgs/pause.png")});
            $("#pauseBtn").mouseup(function(e){_togglePause()});
        }else
            $("#pauseBtn").hide();
        $("#playPauseBtn").mouseup(function(e){_togglePause()});
        $("#playPauseBtn").mouseenter(function(e){$(this).find("img").prop("src", "imgs/play_enter_inv.png")});
        $("#playPauseBtn").mouseleave(function(e){$(this).find("img").prop("src", "imgs/play_inv.png")});

        //Camera Button
        $("#cameraBtn").mouseenter(function(e){$(this).prop("src", "imgs/camera_enter.png")});
        $("#cameraBtn").mouseleave(function(e){$(this).prop("src", "imgs/camera.png")});
        $("#cameraBtn").mouseup(function(e){_self.toggleCamera()});

        //FullScreen Button
        $("#fullScreenBtn").mouseenter(function(e){$(this).prop("src", "imgs/full_screen_enter.png")});
        $("#fullScreenBtn").mouseleave(function(e){$(this).prop("src", "imgs/full_screen.png")});
        $("#fullScreenBtn").mouseup(function(e){ToggleFullScreen(document.getElementById("tw-root"))});

        _GUI.ON_GAME_SCREEN.$ = $("#on-game-screen");
        _GUI.ON_GAME_SCREEN.MARGIN_TOP = -(_GUI.ON_GAME_SCREEN.$.height()/2|0)+"px";
        _GUI.ON_GAME_SCREEN.LEFT = -_GUI.ON_GAME_SCREEN.$.width()+"px";
        _GUI.ON_GAME_SCREEN.$
            .css("margin-top",_GUI.ON_GAME_SCREEN.MARGIN_TOP)
            .css("left", _GUI.ON_GAME_SCREEN.LEFT);

        var _toggleUD = [false,false,false,false]
        $("#ctrl-up").mousedown(function(){
            for (var i=0;i<4;++i){
                _self.keyUp(0, i);
                if (i!=0) _toggleUD[i] = false
            }
            if (!_toggleUD[0])
                _self.RobWalkNorth(0, true);
            _toggleUD[0] = !_toggleUD[0]
        });
        $("#ctrl-down").mousedown(function(){
            for (var i=0;i<4;++i){
                _self.keyUp(0, i);
                if (i!=1) _toggleUD[i] = false
            }

            if (!_toggleUD[1])
                _self.RobWalkSouth(0, true);
            _toggleUD[1] = !_toggleUD[1]
        });
        $("#ctrl-left").mousedown(function(){
            for (var i=0;i<4;++i){
                _self.keyUp(0, i);
                if (i!=2) _toggleUD[i] = false
            }

            if (!_toggleUD[2])
                _self.RobWalkWest(0, true);
            _toggleUD[2] = !_toggleUD[2]
        });
        $("#ctrl-right").mousedown(function(){
            for (var i=0;i<4;++i){
                _self.keyUp(0, i);
                if (i!=3) _toggleUD[i] = false
            }

            if (!_toggleUD[3])
                _self.RobWalkEast(0, true);
            _toggleUD[3] = !_toggleUD[3]
        });
        $("#ctrl-restore").mousedown(function(){ _self.restoreBattery(0) });

        if (!IsMobile())
            $("#controls").remove();

        $(window).blur(function() {
            if (!_Paused)
                _togglePause();
        });

        //-> mouseWheel Event Handler
        $(document).mousewheel(
            function(event, delta){
                var _newRadius;
                _cameraShakingFlag = false;
                if (_ACTIVE_CAMERA != _CAMERA_TYPE.FIRST_PERSON){
                    if (_CL_ActiveCamera.getAnimators()[0]){
                        _newRadius = _cameraFinalRadius - delta*(_cameraFinalRadius)/40;

                        if ( 11 <= _newRadius && _newRadius <= 1915){
                            if (!_Running)
                                $('#tworld').removeClass("blur");
                            _cameraFinalRadius= _newRadius;
                            _CL_CameraModelViewer.RotateSpeed = _CL_CameraModelViewer.Radius*6;
                            _AnimationFactor = 10;
                            _cameraAnimationFlag = 2;
                        }else
                            if (!_Running)
                                $('#tworld').addClass("blur");
                    }else
                        if (_ACTIVE_CAMERA == _CAMERA_TYPE.PERCEPT && _cameraReadyFlag){
                            _newRadius = _cameraFinalPos.Y - delta*(_cameraFinalPos.Y)/40;

                            if (35 <= _newRadius && _newRadius <= 177){
                                _cameraFinalPos.setTo(_CL_ActiveCamera.Pos);
                                _cameraFinalPos.Y = _newRadius;
                                _AnimationFactor = 10;
                                _cameraAnimationFlag = 1;
                            }
                    }
                }
            }
        );

        $(window).mousedown(function(e){
            if (e.which == 3)
                if (!_Paused)
                    _togglePause();
        });

        //-> keydown Event Handler
        $(window).keydown(function(e){
            //console.log(e.keyCode);
            if (IsValidKey(e.keyCode)){
                switch(e.keyCode){
                    case 32://space bar
                        /*_SHOW_HOLES_HELPERS = !_SHOW_HOLES_HELPERS;
                        _toggleHolesHelpersVisible(_SHOW_HOLES_HELPERS);*/
                        _SHOW_VISIBILITY_BOUNDS = !_SHOW_VISIBILITY_BOUNDS;
                        _toggleVisibilityBounds(_SHOW_VISIBILITY_BOUNDS);
                        break;
                    case 13:
                    case 27://Escape
                        _togglePause();
                        break;
                    case 67://C
                        _self.toggleCamera();
                        break;
                    case 70://F
                        ToggleFullScreen(document.getElementById("tw-root"));
                        break;
                    case 16://shift
                        _toggleOnScreenInfo(true);
                }
            }
        });

        //-> keyUp Event Handler
        $(window).keyup(function(e){
            if (IsValidKey(e.keyCode)){
                switch(e.keyCode){
                    case 107://+
                        if (_AUDIO_ENABLE)
                        buzz.all().increaseVolume(25);
                        break;
                    case 109://-
                        if (_AUDIO_ENABLE)
                        buzz.all().decreaseVolume(25);
                        break;
                    case 16://shift
                        _toggleOnScreenInfo(false);
                        break;
                    case 13://enter
                        if ($("#playBtn"))
                            $("#playBtn").mouseup();
                }
            }
        });
        //end region User Input Handler

        if (_AUDIO_ENABLE)
            buzz.all().setVolume(_VOLUME_LEVEL);

        _self.Environment.onLoadingCompleteCallback();
    }

//end region Class Constructor Logic
}


//INTERNAL CLASSES DEFINITION
//( our own 3D scene nodes implementation )
// Class HoleCellHelper
CL3D.HoleCellHelper = function(x, y, z, size, engine, r, g, b, a)
{
    var gl = engine.getRenderer().getWebGL(), p;
    var hSize = size/2;
    var vertex_shader_source = "\
        #ifdef GL_ES                                          \n\
        precision highp float;                                \n\
        #endif                                                \n\
        uniform mat4 worldviewproj;                             \
        attribute vec4 vPosition;                               \
        attribute vec4 vNormal;                                 \
        attribute vec2 vTexCoord1;                              \
        attribute vec2 vTexCoord2;                              \
        varying vec2 v_texCoord1;                               \
        varying vec2 v_texCoord2;                               \
        void main()                                             \
        {                                                       \
            gl_Position = worldviewproj * vPosition;            \
            v_texCoord1 = vTexCoord1.st;                        \
            v_texCoord2 = vTexCoord2.st;                        \
        }";

    if ( gl.getShaderPrecisionFormat === undefined ) 
        gl.getShaderPrecisionFormat = function() {return {"rangeMin": 0,"rangeMax": 0,"precision": 0};}

    p = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision? "highp" : "lowp";

    var fragment_shader_source = "\
        #ifdef GL_ES                                          \n\
        precision "+p+" float;                                \n\
        #endif                                                \n\
        uniform sampler2D texture1;                             \
                                                                \
        varying vec2 v_texCoord1;                               \
                                                                \
        void main()                                             \
        {                                                       \
            vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t); \
            gl_FragColor = vec4("+r+","+g+","+b+","+a+");       \
        }";

    this.init();  // init scene node specific members

    // create a 3d mesh with one mesh buffer

    this.Mesh = new CL3D.Mesh();
    var buf = new CL3D.MeshBuffer();
    this.Mesh.AddMeshBuffer(buf);

    // set indices and vertices
    buf.Vertices = new Array(4);

    buf.Vertices[0] = CreateVertex(x - hSize, y, z + hSize);
    buf.Vertices[1] = CreateVertex(x + hSize, y, z + hSize);
    buf.Vertices[2] = CreateVertex(x + hSize, y, z - hSize);
    buf.Vertices[3] = CreateVertex(x - hSize, y, z - hSize);

    buf.Indices = [0,1,2, 2,3,0];

    // set the texture of the material
    buf.Mat.Type = engine.getRenderer().createMaterialType(vertex_shader_source, fragment_shader_source, true, gl.SRC_ALPHA /*gl.ONE*/, gl.ONE_MINUS_SRC_ALPHA /*gl.ONE_MINUS_SRC_COLOR*/);
}
CL3D.HoleCellHelper.prototype = new CL3D.SceneNode(); // "HoleCellHelper inherits from SceneNode"
CL3D.HoleCellHelper.prototype.OnRegisterSceneNode = function(scene)
{
    if (this.Visible){
        scene.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
        CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, scene); // call base class
    }
}
CL3D.HoleCellHelper.prototype.render = function(renderer)
{
    if (this.Visible){
        renderer.setWorld(this.getAbsoluteTransformation());
        renderer.drawMesh(this.Mesh);
    }
}

// Class LaserBeam
CL3D.LaserBeam = function(srcP, destP, engine, lifeTime)
{
    var gl = engine.getRenderer().getWebGL();
    var hSize = 5;
    var buf = new CL3D.MeshBuffer();
    var scene = engine.getScene();
    var laserHit;
    var _CLN_LaserGlow;

    this.LifeTime = lifeTime;
    this.Mesh = new CL3D.Mesh();


    this.init();  // init scene node specific members

    // create a 3d mesh with one mesh buffer
    this.Mesh.AddMeshBuffer(buf);

    // set indices and vertices
    buf.Vertices = new Array(8);

    buf.Vertices[0] = CreateVertex(srcP.X + hSize, srcP.Y, srcP.Z, 1, 1);
    buf.Vertices[1] = CreateVertex(srcP.X - hSize, srcP.Y, srcP.Z, 0, 0);
    buf.Vertices[2] = CreateVertex(destP.X - hSize, destP.Y-20, destP.Z, 0, 1);
    buf.Vertices[3] = CreateVertex(destP.X + hSize, destP.Y-20, destP.Z, 1, 0);

    buf.Vertices[4] = CreateVertex(srcP.X, srcP.Y, srcP.Z + hSize, 1, 1);
    buf.Vertices[5] = CreateVertex(srcP.X, srcP.Y, srcP.Z - hSize, 0, 0);
    buf.Vertices[6] = CreateVertex(destP.X, destP.Y-20, destP.Z - hSize, 0, 1);
    buf.Vertices[7] = CreateVertex(destP.X, destP.Y-20, destP.Z + hSize, 1, 0);

    buf.Indices = [0,1,2, 2,3,0, 4,5,6, 6,7,4];

    // set the texture of the material
    buf.Mat.Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
    buf.Mat.Tex1 = engine.getTextureManager().getTexture("./copperlichtdata/laserbeam.jpg", true);

    buf.Mat.BackfaceCulling = false;

    //Laser Hits on the ground
    laserHit = scene.getSceneNodeFromName('laserbeam-hit').createClone(scene.getRootSceneNode());

    _CLN_LaserGlow = scene.getSceneNodeFromName('laserbeam-light');
    _CLN_LaserGlow.Pos.set(destP.X, destP.Y-20, destP.Z);
    _CLN_LaserGlow.Visible = true;

    laserHit.Pos.setTo(srcP);
    laserHit.Rot.Y = to180Degrees(random(0, 360));
    laserHit.setLoopMode(true);
    laserHit.setCurrentFrame(0);
    laserHit.setVisible(true);

    scene.getRootSceneNode().addChild(this);

    this.dispose = function(){
        scene.getRootSceneNode().removeChild(laserHit, true);
        scene.getRootSceneNode().removeChild(this, true);
    }
}
CL3D.LaserBeam.prototype = new CL3D.SceneNode(); // "LaserBeam inherits from SceneNode"

CL3D.LaserBeam.prototype.OnRegisterSceneNode = function(scene)
{
    if (this.Visible){
        scene.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
        CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, scene); // call base class
    }
}

CL3D.LaserBeam.prototype.render = function(renderer)
{
    if (this.Visible){
        renderer.setWorld(this.getAbsoluteTransformation());
        renderer.drawMesh(this.Mesh);
    }
}

// helper function for quickly creating a 3d vertex from 3d position and texture coodinates
function CreateVertex(x, y, z, s, t)
{
    var vtx = new CL3D.Vertex3D(true);

    vtx.Pos.X = x;
    vtx.Pos.Y = y;
    vtx.Pos.Z = z;
    vtx.TCoords.X = s;
    vtx.TCoords.Y = t;

    return vtx;
}