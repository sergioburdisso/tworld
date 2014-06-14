/**
*solid-graphic.js
*<p>
*(description here)
*<p>
*_CL_ stands for CopperLitch
*_CLN_ stands for CopperLitch Node (which in this context will mean "3D Object(s)")
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//Class  GraphicTileworld
function GraphicTileworld(graphicEngine, environment){
	//region Attributes
	//-Static:

	//private:
		//region 3D World Parameters
			var _LaserBeamLifeTime	= _FPS; //frames
			var _FloorCellSize		= 10;
			var _FloorCellHeight	= 20;
			var _HoleCellAlpha		= 0.4; // from 0 to 1
			var _BatteryIconY		= 10;//30;
			var _MultiplierFontSize	= 30;

			//Ship Fly Cricle Animation
			var _ShipFlySpeed	= 0.02;//0.01;
			var _ShipFlyRadius	= -1;
			var _ShipFlyCenter	= new CL3D.Vect3d(10, 50, 80);
		//end region World Parameters

		var _CL_Scene;
		var _CL_Engine		= graphicEngine;
		var _CL_Canvas		= _CL_Engine.getRenderer().getWebGL().canvas; //used for calculatin the x and y-scale when animating the score
		var _CL_OnTheFloor	= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
		var _CL_HoleHelpers	= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
		var _CL_Floor		= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
		var _CL_LaserBeams	= new Array();
		var _CLN_Rob = new Array(_NUMBER_OF_ROBS);
		var _CLN_FloorBase;
		var _CLN_UFO;
		var _CLN_LaserGlow;
		var _CLN_S3AR;
		var _CLN_BatteryIcon = new Array();
		var _CLN_BatteryElect = new Array();

		var _self = this;
		var _clOnAnimateCallBack; //for keeping a pointer to the original CopperLitch onAnimate function

		var _floorLimits = new Object();

		var _scoreAnimation = new Array(_NUMBER_OF_ROBS);

		var _FPSFactor = 10; //how fast fps are updated (<_FPSFactor> per 60 frames)
		var _FPSFactorFPS = _FPS/_FPSFactor;
		var _FPSTime = 1000/_FPSFactor;
		var _oldCurrentTime;
		var _oldCurrentFPS;

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
		var _CL_CameraModelViewer;
		var _CL_CameraFlyCircle = new CL3D.AnimatorFlyCircle();

		//sounds
		if (_AUDIO_ENABLE){
			var _sound_ufo_laser_short	= new buzz.sound("./sounds/laser-short.mp3");
			var _sound_teleport_bad		= new buzz.sound("./sounds/teleport_bad.mp3");
			var _sound_score_light		= new buzz.sound("./sounds/score.mp3");
			var _sound_score_full_light	= new buzz.sound("./sounds/score-full.mp3");
			var _sound_score_full		= new buzz.sound("./sounds/score-full2.mp3");
			var _sound_ufo_laser		= new buzz.sound("./sounds/laser.mp3");
			var _sound_teleport			= new buzz.sound("./sounds/teleport.mp3");
			var _sound_timer			= new buzz.sound("./sounds/timer.mp3");
			var _sound_battery_charger	= new buzz.sound("./sounds/battery_charger.mp3");
			var _sound_battery_danger	= new buzz.sound("./sounds/battery-danger.mp3");
			var _sound_out_of_battery	= new buzz.sound("./sounds/rob-turns-off.mp3");
			var _sound_beep				= new buzz.sound("./sounds/beep.mp3");

			var _sound_voice_battery_danger		= [new buzz.sound("./sounds/voices/"+_LANGUAGE+"/voice_battery-danger0.mp3"), new buzz.sound("./sounds/voices/"+_LANGUAGE+"/voice_battery-danger1.mp3")];
			var _sound_voice_countdown			= new Array(11);
			var _sound_voice_energy				= [new buzz.sound("./sounds/voices/"+_LANGUAGE+"/voice_full-energy0.mp3"), new buzz.sound("./sounds/voices/"+_LANGUAGE+"/voice_full-energy1.mp3")];
			var _sound_voice_pause				= new buzz.sound("./sounds/voices/"+_LANGUAGE+"/voice_pause.mp3");
			for (var i=0; i<=10;i++)
			_sound_voice_countdown[i] = new buzz.sound("./sounds/voices/"+_LANGUAGE+"/voice_"+i+".mp3");
		}
	//public

		this.currentFPS = _FPS;
		this.Environment = environment;
		this.Rob  = new Array(1);
//end region Attributes
//
//region Methods
	//region Public
		//region Getters And Setters
			this.getOnTheFloorMatrix	= function() {return _CL_OnTheFloor;}
			this.getNodeOnTheFloorAt	= function(row, column) {return _CL_OnTheFloor[row][column];}
			this.getFloorCellSize		= function() {return _FloorCellSize;}
			this.getActiveCamera		= function() {return _CL_ActiveCamera;}
			this.getFloorLimits			= function() {return _floorLimits;}
			this.getCLEngine			= function() {return _CL_Engine;}

			this.setRobLocation 	= function(rIndex, row, column) {
				if (this.Rob[rIndex])
					this.Rob[rIndex].setXZ(row*_FloorCellSize + _floorLimits.X0, column*_FloorCellSize);
			}

			this.setBatteryChargerLocation = function(row, column){
				bcIndex = _CLN_BatteryIcon.length;

				if (_CLN_BatteryIcon.length == 0){
					_CLN_BatteryIcon.push(_CL_Scene.getSceneNodeFromName('battery-charger-icon'));
					_CLN_Rob[0].getParent().addChild(_CLN_BatteryIcon[0]);
				}else
					_CLN_BatteryIcon.push(_CLN_BatteryIcon[0].createClone(_CLN_Rob[0].getParent()));

				_CLN_BatteryIcon[bcIndex].Pos.X = GraphicTileworld.RowIndexToXPosition(row);
				_CLN_BatteryIcon[bcIndex].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(column);

				_CL_Floor[row][column][1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_battery.png", true);
				_CL_Floor[row][column][0].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_battery.png", true);;

				_CLN_BatteryElect.push( _CL_Scene.getSceneNodeFromName('obstacle').createClone(_CL_Scene.getSceneNodeFromName('dummy')) );
				_CLN_BatteryElect[bcIndex].Pos.X = GraphicTileworld.RowIndexToXPosition(row);
				_CLN_BatteryElect[bcIndex].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(column);
				_CLN_BatteryElect[bcIndex].Scale.Y = 3;
				_CLN_BatteryElect[bcIndex].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/battery-elec.png", true);
				_CLN_BatteryElect[bcIndex].setCurrentFrame(Math.random()*_CLN_BatteryElect[bcIndex].getNamedAnimationInfo(0).End);
				_CLN_BatteryElect[bcIndex].setVisible(true);
			}

			this.batteryCharge
		//end region Getters And Setters
		//
		//region Static
			//--------------------------------------------------------------------------------------------------------------------> RowIndexToXPosition
			GraphicTileworld.RowIndexToXPosition = function(irow) {return (irow*_FloorCellSize - _CL_Floor.length*_FloorCellSize/2);}

			//--------------------------------------------------------------------------------------------------------------------> ColumnIndexToZPosition
			GraphicTileworld.ColumnIndexToZPosition = function(icolumn) {return (icolumn*_FloorCellSize);}
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

		this.keyUp = function(rIndex, key){this.Rob[rIndex].keyUp(key)}

		this.restoreBattery = function(rIndex, noStats){this.Rob[rIndex].restoreBattery(noStats)}

		this.gameIsOver = function(robs, goal) {
			var	cameraCase, imaxCells, imaxMoves,
				iminMoves, imaxMovesNotOK, imaxScore,
				imaxBatteryUse, imaxBatteryRecharge,
				imaxBatteryRestore, finalPositions = new Array(3),
				firstOne;

			//TEAMS STATS:
			for (var holes, moves, battery, i=0; i < _TEAMS.length; i++){
				_TEAMS[i].STATS = {
									MFinalScore: robs[_TEAMS[i].MEMBERS[0]].Score,
									MTotalScore: 0,
									MHoles: 0,
									MCells: 0,
									mMovesOK: 0,
									mMovesNotOK: 0,
									mBattery_Use:0,
									mBattery_Restore:0,
									mBattery_Recharge:0,
								};
				for (var m=_TEAMS[i].MEMBERS.length-1; m >= 0; --m){
					_TEAMS[i].STATS.MTotalScore += robs[_TEAMS[i].MEMBERS[m]].Stats.Score;
					_TEAMS[i].STATS.MHoles += robs[_TEAMS[i].MEMBERS[m]].Stats.Holes;
					_TEAMS[i].STATS.MCells += robs[_TEAMS[i].MEMBERS[m]].Stats.Cells;
					_TEAMS[i].STATS.mMovesOK += robs[_TEAMS[i].MEMBERS[m]].Stats.MovesOK;
					_TEAMS[i].STATS.mMovesNotOK += robs[_TEAMS[i].MEMBERS[m]].Stats.MovesNotOK;
					_TEAMS[i].STATS.mBattery_Use += robs[_TEAMS[i].MEMBERS[m]].Stats.Battery.Use;
					_TEAMS[i].STATS.mBattery_Restore += robs[_TEAMS[i].MEMBERS[m]].Stats.Battery.Restore;
					_TEAMS[i].STATS.mBattery_Recharge += robs[_TEAMS[i].MEMBERS[m]].Stats.Battery.Recharge;
				}
			}

			//in case of tied game the method to try to break the tie, in order, is:
			// +FinalScore
			// +TotalScore
			// +Holes
			// +Cells
			// -MovesOK
			// -MovesNotOK
			// -Battery_Use
			// -Battery_Restore
			// -Battery_Recharge
			finalPositions = _sortAndPartition(_TEAMS).flatteningAllButTied();


			//1st, 2nd and 3rd positions
			for (var pos = 0, r=0; r < 3; ++r, ++pos){
				if (r < _TEAMS.length){
					if (finalPositions[pos] instanceof Array){// if it is a group of tied results
						for (var i= 0; i < finalPositions[pos].length && r < 3; ++i, ++r){
							$('#'+(r+1)+'-pos').append('<img src="./imgs/'+(pos+1)+'-pos.png" />');
							$('#'+(r+1)+'-player').html(finalPositions[pos][i].NAME);
							$('#'+(r+1)+'-score').html(finalPositions[pos][i].STATS.MFinalScore + "/" + finalPositions[pos][i].STATS.MTotalScore);
							$('#'+(r+1)+'-holes').html(finalPositions[pos][i].STATS.MHoles + "/" + finalPositions[pos][i].STATS.MCells);
							$('#'+(r+1)+'-moves').html(finalPositions[pos][i].STATS.mMovesOK + "/" + finalPositions[pos][i].STATS.mMovesNotOK);
							$('#'+(r+1)+'-battery').html((finalPositions[pos][i].STATS.mBattery_Use/10).toFixed(1) + "/" + finalPositions[pos][i].STATS.mBattery_Restore);

							if (pos === 0)
								firstOne = finalPositions[pos][i];
						}
						r--;
					}else{
						$('#'+(r+1)+'-pos').append('<img src="./imgs/'+(pos+1)+'-pos.png" />');
						$('#'+(r+1)+'-player').html(finalPositions[pos].NAME);
						$('#'+(r+1)+'-score').html(finalPositions[pos].STATS.MFinalScore + "/" + finalPositions[pos].STATS.MTotalScore);
						$('#'+(r+1)+'-holes').html(finalPositions[pos].STATS.MHoles + "/" + finalPositions[pos].STATS.MCells);
						$('#'+(r+1)+'-moves').html(finalPositions[pos].STATS.mMovesOK + "/" + finalPositions[pos].STATS.mMovesNotOK);
						$('#'+(r+1)+'-battery').html((finalPositions[pos].STATS.mBattery_Use/10).toFixed(1) + "/" + finalPositions[pos].STATS.mBattery_Restore);

						if (pos === 0)
							firstOne = finalPositions[pos];

					}
				}else
					$('#'+(r+1)+'-row').hide();
			}

			//PLAYERS STATS:
			imaxCells = imaxMoves = iminMoves =
			imaxMovesNotOK = imaxBatteryUse = imaxBatteryRecharge =
			imaxBatteryRestore = imaxScore = 0;

			for (var i= 1; i < _NUMBER_OF_ROBS; i++){
				if (robs[i].Stats.MovesNotOK > robs[imaxMovesNotOK].Stats.MovesNotOK)
					imaxMovesNotOK = i;

				if (robs[i].Stats.MovesOK > robs[imaxMoves].Stats.MovesOK)
					imaxMoves = i;

				if (robs[i].Stats.MovesOK < robs[iminMoves].Stats.MovesOK)
					iminMoves = i;

				if (robs[i].Stats.Cells > robs[imaxCells].Stats.Cells)
					imaxCells = i;

				if (robs[i].Stats.Battery.Restore > robs[imaxBatteryRestore].Stats.Battery.Restore)
					imaxBatteryRestore = i;

				if (robs[i].Stats.Battery.Use > robs[imaxBatteryUse].Stats.Battery.Use)
					imaxBatteryUse = i;

				if (robs[i].Stats.Battery.Recharge > robs[imaxBatteryRecharge].Stats.Battery.Recharge)
					imaxBatteryRecharge = i;

				if (robs[i].Stats.Score > robs[imaxScore].Stats.Score)
					imaxScore = i;
			}

			//in case of tie
			for (var i= 0; i < _NUMBER_OF_ROBS; i++){
				if (imaxMovesNotOK != -1 && imaxMovesNotOK != i && robs[i].Stats.MovesNotOK == robs[imaxMovesNotOK].Stats.MovesNotOK)
					imaxMovesNotOK = -1;

				if (imaxMoves != -1 && imaxMoves != i && robs[i].Stats.MovesOK == robs[imaxMoves].Stats.MovesOK)
					imaxMoves = -1;

				if (iminMoves != -1 && iminMoves != i && robs[i].Stats.MovesOK == robs[iminMoves].Stats.MovesOK)
					iminMoves = -1;

				if (imaxCells != -1 && imaxCells != i && robs[i].Stats.Cells == robs[imaxCells].Stats.Cells)
					imaxCells = -1;

				if (imaxBatteryUse != -1 && imaxBatteryUse != i && robs[i].Stats.Battery.Use == robs[imaxBatteryUse].Stats.Battery.Use)
					imaxBatteryUse = -1;

				if (imaxBatteryRestore != -1 && imaxBatteryRestore != i && robs[i].Stats.Battery.Restore == robs[imaxBatteryRestore].Stats.Battery.Restore)
					imaxBatteryRestore = -1;

				if (imaxBatteryRecharge != -1 && imaxBatteryRecharge != i && robs[i].Stats.Battery.Recharge == robs[imaxBatteryRecharge].Stats.Battery.Recharge)
					imaxBatteryRecharge = -1;

				if (imaxScore != -1 && imaxScore != i && robs[i].Stats.Score == robs[imaxScore].Stats.Score)
					imaxScore = -1;
			}

			if (iminMoves != -1){
				$('#min-moves').html(robs[iminMoves].Stats.MovesOK + "<br>(" + _ROBS[iminMoves].NAME +")");
				$('#min-moves').parent().show();
			}

			if (imaxMoves != -1){
				$('#max-moves').html(robs[imaxMoves].Stats.MovesOK + "<br>(" + _ROBS[imaxMoves].NAME +")");
				$('#max-moves').parent().show();
			}

			if (imaxMovesNotOK != -1){
				$('#invalid-moves').html(robs[imaxMovesNotOK].Stats.MovesNotOK + "<br>(" + _ROBS[imaxMovesNotOK].NAME +")");
				$('#invalid-moves').parent().show();
			}

			if (imaxCells != -1){
				$('#max-cells').html(robs[imaxCells].Stats.Cells + "<br>(" + _ROBS[imaxCells].NAME +")");
				$('#max-cells').parent().show();
			}

			if (imaxBatteryUse != -1){
				$('#max-battery-use').html((robs[imaxBatteryUse].Stats.Battery.Use/10).toFixed(1) + "%<br>(" + _ROBS[imaxBatteryUse].NAME +")");
				$('#max-battery-use').parent().show();
			}

			if (imaxBatteryRecharge != -1){
				$('#max-battery-recharge').html(robs[imaxBatteryRecharge].Stats.Battery.Recharge + "<br>(" + _ROBS[imaxBatteryRecharge].NAME +")");
				$('#max-battery-recharge').parent().show();
			}

			if (imaxBatteryRestore != -1){
				$('#max-battery-restore').html(robs[imaxBatteryRestore].Stats.Battery.Restore + "<br>(" + _ROBS[imaxBatteryRestore].NAME +")");
				$('#max-battery-restore').parent().show();
			}

			if (imaxScore != -1){
				$('#max-score').html(robs[imaxScore].Stats.Score + "<br>(" + _ROBS[imaxScore].NAME +")");
				$('#max-score').parent().show();
			}

			$("#table-goals").hide();
			$('#tileworld').addClass("blur");
			$("#playPauseBtn").hide();
			$("#time").hide();
			$("#robs-hud").hide();
			$("#pie").hide();
			$("#pauseBtn").hide();
			$("#cameraBtn").hide();
			$("#title").css("font-size","70px")

			switch(goal.OUTCOME){
				case _GAME.WON:
					$("#title").
						css("color","rgb(59, 255, 153)")
						.html(_GAMEOVER.MESSAGES.WON.TEXT);
					$("#sub-title").html(_GAMEOVER.MESSAGES.WON.SUBTEXTS[random(_GAMEOVER.MESSAGES.WON.SUBTEXTS)]);
					break;
				case _GAME.LOST:
					$("#title")
						.css("color", "red")
						.css("text-shadow", "rgb(255, 0, 72) 0px 0px 20px")
						.html(_GAMEOVER.MESSAGES.LOST.TEXT);
					$("#sub-title").html(_GAMEOVER.MESSAGES.LOST.SUBTEXTS[random(_GAMEOVER.MESSAGES.LOST.SUBTEXTS)]);
					break;
				case _GAME.NEUTRAL:
					$("#table-pos").show();
					$("#bs-mid").css("opacity", 0).show();
					$("#title").html(goal.MESSAGE? goal.MESSAGE : _GAMEOVER.MESSAGES.NEUTRAL.TEXT);
					$("#sub-title").html(_GAMEOVER.MESSAGES.NEUTRAL.SUBTEXTS[random(_GAMEOVER.MESSAGES.NEUTRAL.SUBTEXTS)]);
			}

			$("#black-screen").show();
			$("#black-screen").animate({opacity:1}, 3000, function(){$("#bs-mid").animate({opacity:1,"margin-top": (-$("#bs-mid").height()/2|0)+"px"}, 400)});

			cameraCase = (Math.random() < 0.5 || _LOW_QUALITY_WORLD)? 0 : 1;
			if (!firstOne) firstOne = _TEAMS[0];
			_CL_CameraFlyCircle.Center.setTo((cameraCase == 0)? _CLN_Rob[firstOne.MEMBERS[0]].Pos : _CLN_S3AR.Pos);
			_CL_CameraFlyCircle.Center.Y += (cameraCase == 0)? 16 : 0;
			_CL_ActiveCameraTarget.setTo(_CL_CameraFlyCircle.Center);
			_CL_CameraFlyCircle.Radius = (cameraCase == 0)? Math.max(_ROWS, _COLUMNS)*_FloorCellSize/2 : 1400;
			_CL_ActiveCamera.Animators.push(_CL_CameraFlyCircle);
		}

		this.updateTime = function(value, countdown) {
			var mins = (value/60|0);
			var segs = value%60;

			mins = (mins < 10)? "0"+mins : mins;
			segs = (segs < 10)? "0"+segs : segs;

			$("#time").html((value > 10 || !countdown)? mins +":"+ segs : value);

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
			$("#rob-"+lIndex).find("#score").html(score);

			if (points > 0){
				//_holeIsFilled = filled;
				_scoreAnimation[rIndex].HoleFilledCells.length = holeCells.length;
				_scoreAnimation[rIndex].Points = points;
				_scoreAnimation[rIndex].StrPoints = strPoints;
				_scoreAnimation[rIndex].Filled = filled;

				for (var i=0; i < holeCells.length; i++){
					_scoreAnimation[rIndex].HoleFilledCells[i] = [
						GraphicTileworld.RowIndexToXPosition(holeCells[i][0]),
						GraphicTileworld.ColumnIndexToZPosition(holeCells[i][1])
					];
				}

				if (filled){
					if (_AUDIO_ENABLE)
						_sound_score_full.setPercent(0).play();

					$("#frameColor").show();
					$("#frameColor").css({opacity: 0.5 , 'background-color' : 'rgb(255,255,255)'});
					$("#frameColor").stop(true).animate({opacity:0}, 1000, function(){$("#frameColor").hide();});
				}
			}else{
				var $scoreUp = "#score-up-" + lIndex;
				var $rob = "#rob-" + lIndex;

				$($scoreUp).html(points);

				$($scoreUp).css({
					left: $($rob).find("#score").offset().left-20+'px',
					top: $($rob).find("#score").offset().top+'px',
					'font-size' : '30px',
					color: 'red',
					opacity:1
				});

				$($scoreUp).show();
				$($scoreUp).stop(true).animate(
					{
					left: ($($scoreUp).offset().left + 80) +'px',
					opacity:0
					},
					1000,
					function(){$($scoreUp).hide();$($scoreUp).css("color",'rgb(255, 105, 0)').css("opacity",1)}
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

		this.updateBattery = function(rIndex, value) {
			rIndex = _GET_TEAM_LEADER(rIndex);
			var $id = "#rob-"+rIndex;

			if (!this.batteryWarning)
				this.batteryWarning = new Array(_NUMBER_OF_ROBS);

			if (value <= 0) {
				value = 0;
				$($id).find("#battery-charge-frame").css("box-shadow", "0 0 10px red");
				_sound_out_of_battery.setPercent(0).play();
			}else
				if (value >= 1000){
					value = 1000;
					$($id).find("#battery-charge-frame").css("box-shadow", "0 0 10px rgba(87, 255, 168, 0.57)");

					if (_Ready){
						_self.showTeleport(_CLN_Rob[rIndex], true, false, true);

						for (var team= _GET_TEAM_OF(rIndex), irob=team.length-1; irob >= 0; --irob)
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
			_CLN_Tile.Pos.X = GraphicTileworld.RowIndexToXPosition(tileCell[0]);
			_CLN_Tile.Pos.Z = GraphicTileworld.ColumnIndexToZPosition(tileCell[1]);
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

			for (var i = 0, laser, row, column; i < holeCells.getLength(); i++){
				row = holeCells.getItemAt(i)[0];
				column = holeCells.getItemAt(i)[1];
				_CL_Floor[row][column][0].Visible = false;
				_CL_Floor[row][column][1].setVisible(false);

				if (_CL_HoleHelpers[row][column])
					_CL_Scene.getSceneNodeFromName('layer1').removeChild(_CL_HoleHelpers[row][column]);

				_CL_HoleHelpers[row][column] = new CL3D.HoleCellHelper(0,0.2,0,_FloorCellSize,_CL_Engine, r, g, b, _HoleCellAlpha);
				_CL_HoleHelpers[row][column].Pos.X = GraphicTileworld.RowIndexToXPosition(row);
				_CL_HoleHelpers[row][column].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(column);
				_CL_HoleHelpers[row][column].setVisible(_SHOW_HOLES_HELPERS);

				_CL_Scene.getSceneNodeFromName('layer1').addChild(_CL_HoleHelpers[row][column]);

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
			_CLN_Elect.Pos.X = GraphicTileworld.RowIndexToXPosition(obstacleCell[0]);
			_CLN_Elect.Pos.Z = GraphicTileworld.ColumnIndexToZPosition(obstacleCell[1]);
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

		//------------------------------------------------------------------------------------------------------------------------> 
		this.fillHole = function(rIndex, direction, holeCell){

			var CL_Tile = _CL_OnTheFloor[holeCell[0]][holeCell[1]];

			this.Environment.getListOfTilesToSlide(rIndex).remove(holeCell[0], holeCell[1]);

			if (CL_Tile){
				CL_Tile.setMinimalUpdateDelay(
					(_AUTO_MINIMAL_UPDATE_DELAY)?
						((_self.currentFPS <= _FPS)? _FPS - _self.currentFPS : 0)
						:
						_MINIMAL_UPDATE_DELAY
				);

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
	//end region Public
	//
	//region private
		///<summary>
		//this function contains all the code for the logic to generate the next frame to be displayed , and it's obviously executed each frame
		//</summary>
		//------------------------------------------------------------------------------------------------------------> onAnimate
		function display(CL_Scene, currentTime) {
			if (!_Paused){
				//Rob's animation
				var rob = _NUMBER_OF_ROBS;
				while (rob--)
					_self.Rob[rob].animate();

				//UFO animation
				ShipFlyCircle();
				_CLN_UFO.Rot.Y = CL3D.radToDeg(Math.atan2(_CLN_UFO.Pos.X- _CLN_Rob[0].Pos.X, _CLN_UFO.Pos.Z - _CLN_Rob[0].Pos.Z));

				//Camera animation
				//if (_Running){
				if (_cameraAnimationFlag){
					var r;
					if (_cameraAnimationFlag == 1){
						var xt = (_cameraTargetFinalPos.X - _CL_ActiveCameraTarget.X);
						var yt = (_cameraTargetFinalPos.Y - _CL_ActiveCameraTarget.Y);
						var zt = (_cameraTargetFinalPos.Z - _CL_ActiveCameraTarget.Z);
						var x = (_cameraFinalPos.X - _CL_ActiveCamera.Pos.X);
						var y = (_cameraFinalPos.Y - _CL_ActiveCamera.Pos.Y);
						var z = (_cameraFinalPos.Z - _CL_ActiveCamera.Pos.Z);
						

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
							_CL_ActiveCamera.Pos.X = _cameraFinalPos.X;
							_CL_ActiveCamera.Pos.Y = _cameraFinalPos.Y;
							_CL_ActiveCamera.Pos.Z = _cameraFinalPos.Z;
						}else{
							_CL_ActiveCamera.Pos.X += x/_AnimationFactor;
							_CL_ActiveCamera.Pos.Y += y/_AnimationFactor;
							_CL_ActiveCamera.Pos.Z += z/_AnimationFactor;
						}

						if (xt+yt+zt+x+y+z == 0)
							_cameraReadyFlag = !(_cameraAnimationFlag = 0);
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

				if (_ACTIVE_CAMERA == _CAMERA_TYPE.ALIEN)
					if (!_cameraAnimationFlag){
						_CL_ActiveCamera.Pos.setTo(_CLN_UFO.Pos);
						_CL_ActiveCamera.Pos.Y += 1;
					}else{
						_cameraFinalPos.setTo(_CLN_UFO.Pos);
						_cameraFinalPos.Y += 3.6;
					}

				if (_FollowRob){
					if (_CAMERA_SMOOTH){
						_cameraXPosOffset = (_CLN_Rob[0].Pos.X - _CL_ActiveCameraTarget.X)/30;
						_cameraZPosOffset = (_CLN_Rob[0].Pos.Z - _CL_ActiveCameraTarget.Z)/30;

						if (Math.abs(_cameraXPosOffset) > 0.05){
							if (_ACTIVE_CAMERA == _CAMERA_TYPE.FREE_ROB)
								_CL_ActiveCamera.Pos.X += _cameraXPosOffset;
							_CL_ActiveCameraTarget.X += _cameraXPosOffset;
						}

						if (Math.abs(_cameraZPosOffset) > 0.05){
							if (_ACTIVE_CAMERA == _CAMERA_TYPE.FREE_ROB)
								_CL_ActiveCamera.Pos.Z += _cameraZPosOffset;
							_CL_ActiveCameraTarget.Z += _cameraZPosOffset;
						}
					}else{
						_CL_ActiveCameraTarget.X = _CLN_Rob[0].Pos.X;
						_CL_ActiveCameraTarget.Z = _CLN_Rob[0].Pos.Z;
					}
				}

				if (_cameraShakingFlag && _CL_CameraModelViewer.CursorControl.isMouseDown())
					_cameraShakingFlag = false;

				if (!_cameraAnimationFlag){
					if (!_cameraShakingFlag && !CL3D.equals(_CL_ActiveCamera.Pos.Y,_cameraFixedPosY)){
						_cameraFixedPosY = _CL_ActiveCamera.Pos.Y;
						_cameraShakingOrg = _CLN_UFO.Pos.Y - _ShipFlyCenter.Y;
					}else{
						_CL_ActiveCamera.Pos.Y = _cameraFixedPosY + /*(4/15)*/0.26*((_CLN_UFO.Pos.Y - _ShipFlyCenter.Y) - _cameraShakingOrg);
						_cameraShakingFlag = true;
					}
				}

				//region laser beams animation
					if (_CL_LaserBeams.length == 0 && _CLN_LaserGlow.Visible){
						if (_AUDIO_ENABLE)
							_sound_ufo_laser.stop();

						_CLN_LaserGlow.setVisible(false);
						_CLN_UFO.Stop = false;
					}else
						for (var i=0; i < _CL_LaserBeams.length; i++){
							if (_CL_LaserBeams[i].LifeTime-- <= 0){
								_CL_LaserBeams[i].dispose();
								_CL_LaserBeams.splice(i,1);
								--i;
							}
						}
				//end region laser beams

				//region fps calculation (how many time does it take the browser to render 60 frames?)
					if (this.framesCounter === undefined){
						this.currentFPSCounter = _FPS;
						this.oldCurrentFPS = 0;
						this.framesCounter = 0;
						this.seconds = 0;
						_oldCurrentTime = currentTime;
					}

					this.framesCounter = (this.framesCounter+1)%_FPSFactorFPS;
					this.currentFPSCounter = (this.currentFPSCounter + 1)%_self.currentFPS;

					if (this.framesCounter == 0){
						_self.currentFPS = (parseInt(_FPS/((currentTime - _oldCurrentTime)/_FPSTime))+_self.currentFPS)/2|0;
						if (_self.currentFPS < 1)
							_self.currentFPS = 1;

						if (this.currentFPSCounter > _self.currentFPS)
							this.currentFPSCounter = 0;


						_LaserBeamLifeTime = _self.currentFPS;

						//auto calculate Rob's movements speed according to user's PC performance (current fps)
						_self.Environment.Costs.move = GraphicRob.AutocalculateSpeed(_self.currentFPS);
						_self.Environment.Costs.move = (Math.ceil(_FloorCellSize/_self.Environment.Costs.move)/_self.currentFPS).toFixed(2);

						if (_AUTO_MINIMAL_UPDATE_DELAY)
							_CLNs_setMinimalUpdateDelay(_self.currentFPS);

						if (_SHOW_FPS)
							$("#fps").html(_self.currentFPS + " fps");

						//waiting for the fps to stabilize
						if (!_Ready){
							if (_self.currentFPS > this.oldCurrentFPS)
								this.oldCurrentFPS = _self.currentFPS;
							else{
								_Ready = true;

								//if everything is loaded
								if (!CL3D.LoadingTimer){
									$("#playFrame").show();
									$("#playFrame").animate({opacity : 1}, 1000);
								}
							}
						}

						_oldCurrentTime = currentTime;
					}
				//end region fps calculation

				//every second let the environment know a second has passed...
				if (this.currentFPSCounter  == 0)
					_self.Environment.tick();


				//CL graphicEngine I let you do your stuff! (calling the original onAnimate function)
				_clOnAnimateCallBack.apply(this, [CL_Scene, currentTime]);
			}
		}

		function _CLNs_setMinimalUpdateDelay(frames){
				frames = (frames <= _FPS)? _FPS - frames : 0;

				_CL_Scene.getSceneNodeFromName('ufo').setMinimalUpdateDelay(frames);
				_CL_Scene.getSceneNodeFromName('astromaxi').setMinimalUpdateDelay(frames);
				_CL_Scene.getSceneNodeFromName('laserbeam-hit').setMinimalUpdateDelay(frames);
				_CL_Scene.getSceneNodeFromName('laserbeam-strong-hit').setMinimalUpdateDelay(frames);
				_CL_Scene.getSceneNodeFromName('tp-halo').setMinimalUpdateDelay(frames);
				_CL_Scene.getSceneNodeFromName('holefilled-light').setMinimalUpdateDelay(frames);

				for (var i=0; i < _NUMBER_OF_ROBS; ++i)
				_self.Rob[i].setMinimalUpdateDelay(frames);
		}

		function _sortAndPartition(list, criteria){
			var tiePartitions = [];
			var oapList = [];// oap stands for "Ordered and Partitioned"

			criteria = nextProperty(list[0].STATS, criteria);

			//recursion stopping condition
			if (list.length <= 1 || !criteria)
				return list;

			//sorting the list according to criteria
			if (criteria[0] == "M")
				list.sort(function(a,b){return b.STATS[criteria] - a.STATS[criteria]});
			else
				list.sort(function(b,a){return b.STATS[criteria] - a.STATS[criteria]});

			//creating partitions according to equal results (tied cases)
			for (var prevValue = null, k=-1, i=0; i < list.length; i++)
				if (list[i].STATS[criteria] === prevValue)
					tiePartitions[k].push(list[i]);
				else{
					//creating a new partition of "equal values"
					tiePartitions.push([list[i]]);
					prevValue = list[i].STATS[criteria];
					k++;
				}

			//for each partition
			for (var p=0; p < tiePartitions.length; ++p)
				oapList.push(
					_sortAndPartition(tiePartitions[p], criteria) //recursive call
				);

			return oapList;
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

		function _toggleHolesHelpersVisible(visible){
			//O(n^2)
			for (var irow= 0; irow < _CL_HoleHelpers.length; irow++)
				for (var icolumn= 0; icolumn < _CL_HoleHelpers[0].length; icolumn++)
					if (_CL_HoleHelpers[irow][icolumn])
						_CL_HoleHelpers[irow][icolumn].setVisible(_SHOW_HOLES_HELPERS);
		}

		function _togglePause(){
			if (_Running){
				if (!this.pauseTime)
					this.pauseTime = null;

				_CL_Engine.IsPaused = (_Paused = !_Paused);

				if (_Paused){
					if (_AUDIO_ENABLE){
						buzz.all().setVolume(0);
						_sound_voice_pause.setPercent(0).setVolume(40).play();
					}

					this.pauseTime = CL3D.CLTimer.getTime();
					
					$("#tileworld").addClass("blur");
					$("#header").hide();
					$("#black-screen").find("#title").css("font-size", "30px").html("PAUSE");
					$('#playBtn').show();
					$("#black-screen").show();
					$("#black-screen").stop(true).animate({opacity:1}, 400);
					$("#bs-mid").css("margin-top", (-$("#bs-mid").height()/2|0)+"px");
					_toggleOnScreenInfo(true, true);
				}else{
					_oldCurrentTime += CL3D.CLTimer.getTime() - this.pauseTime;
					$("#tileworld").removeClass("blur");
					$("#header").show();
					$('#playBtn').hide();
					$("#black-screen").hide();
					$("#black-screen").css("opacity", "0");
					_toggleOnScreenInfo(false);

					for (var r=0; r < _NUMBER_OF_ROBS; ++r)
					for (var i=0; i < 4; ++i)
						_self.keyUp(r, i);

					if (_AUDIO_ENABLE)
					buzz.all().setVolume(_VOLUME_LEVEL);
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

			switch(_ACTIVE_CAMERA){
				case _CAMERA_TYPE.FREE_GRID:
					_cameraTargetFinalPos.setTo(_CLN_FloorBase.Pos);
					_cameraFinalPos.set(-(Math.max(_ROWS, _COLUMNS)*_FloorCellSize-40), 50, Math.max(_ROWS, _COLUMNS)*_FloorCellSize/2);
					_cameraFinalRadius = Math.max(_ROWS, _COLUMNS)*_FloorCellSize + 20;//10;
					_CL_CameraModelViewer.RotateSpeed = _cameraFinalRadius*6;
					_CL_ActiveCamera.Animators.clear();
					_CL_ActiveCamera.Animators.push(_CL_CameraModelViewer);
					break;

				case _CAMERA_TYPE.FREE_ROB:
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

				case _CAMERA_TYPE.PERCEPT:
					_cameraTargetFinalPos.setTo(_CLN_FloorBase.Pos);
					_cameraFinalPos.setTo(_CLN_FloorBase.Pos);
					_cameraFinalPos.Y = 125;
					_cameraFinalPos.Z-= 0.1;
					_cameraFinalPos.X+= 14;
					_CL_ActiveCamera.Animators.clear();
					break;

				case _CAMERA_TYPE.ALIEN:
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
					_CLN_UFO.Pos.setTo(_ShipFlyCenter);
				}else
					this.Time++;

				if(this.Time!=0){
					var b=this.Time*_ShipFlySpeed;
					var _RadiusVariation = 20;

					this.VecT0.setTo(this.VecU).multiplyThisWithScal(Math.cos(b)).addToThis(this.VecT1.setTo(this.VecV).multiplyThisWithScal(Math.sin(b)));

					this.VecT0.multiplyThisWithScal( _ShipFlyRadius + _RadiusVariation + Math.cos(this.Time/30)*_RadiusVariation);
					_CLN_UFO.Pos.setTo(_ShipFlyCenter).addToThis(this.VecT0);

					_CLN_UFO.Pos.Y = 60 + Math.sin(this.Time/50)*15;

					if (Tileworld.Battery)
						for (var bc= _CLN_BatteryIcon.length-1; bc >=0; --bc)
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
			var tpHalo= _CL_Scene.getSceneNodeFromName('tp-halo').createClone(_CL_Scene.getSceneNodeFromName('dummy-tile'));//TODO: could be improved (garbage!!)

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
				if (!isBattery && _AUDIO_ENABLE)
					_sound_teleport.play();

			tpHalo.setAnimation("halo");
			tpHalo.setCurrentFrame(0);
			tpHalo.Visible  = false;
			tpHalo.setVisible(true);
			if (isBattery){
				tpHalo.Scale.Y = 3.6;
				tpHalo.Pos.Y += 10.6;
				tpHalo.Rot.X = 180;
				tpHalo.setAnimationSpeed(60);

				if (_AUDIO_ENABLE)
					if (!isRed){
						var _voice = _sound_voice_energy[random(_sound_voice_energy.length)];
						CallWithDelay.Enqueue(_voice.play, null, 1, _voice);
						_sound_battery_charger.setPercent(0).play();
					}else
						_sound_teleport_bad.setPercent(0).play();
			}

			tpHalo.Node = node;
			tpHalo.IsTile = isTile;
			tpHalo.OriginalOnAnimate = tpHalo.OnAnimate;
			tpHalo.OnAnimate = CL_TPHalo_OnAnimate;
		}

		this.showHoleFilledLight = function(rIndex, pair /*[x,z]*/) {
			var light= _CL_Scene.getSceneNodeFromName('holefilled-light').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (Clone = garbage collection!!)
			var $scoreUp = "#score-up-" + rIndex;
			var $rob = "#rob-" + _GET_TEAM_LEADER(rIndex);
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
				$($scoreUp).html(_scoreAnimation[rIndex].StrPoints);

				if (pos2d){
					var parentWidth = _CL_Canvas.parentNode.clientWidth;//$(window).width();
					var parentHeight = _CL_Canvas.parentNode.clientHeight;//$(window).height();
					$($scoreUp).css({
						left: parseInt(pos2d.X*(parentWidth/_CL_Canvas.width))+'px', // x*(width/origWidth) to respect the x-scale (when window is resized)
						top: parseInt(pos2d.Y*(parentHeight/_CL_Canvas.height))+'px',// y*(height/origHeight) to respect the y-scale (when window is resized)
						'font-size':	$("#tileworld").height()*0.15+'px',
						'text-shadow':	'0 0 10px ' + (_scoreAnimation[rIndex].Filled? 'rgb(255, 113, 198)': 'rgb(255, 0, 201)'),
						color:			_scoreAnimation[rIndex].Filled? 'rgb(255, 0, 204)': 'rgb(255, 105, 0)',
						opacity:1
					});
				}

				$($scoreUp).show();
				$($scoreUp).stop(true).animate(
					{left: $($rob).find("#score").offset().left+'px', top: $($rob).find("#score").offset().top+'px', fontSize: '30px'},
					1000,
					function(){
						$($scoreUp).hide();
						$($rob).find("#score").stop(true).animate({fontSize : '50px'},100).animate({fontSize: '30px'},600);
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

			for (var i=0, CLN_CellLight; i < _scoreAnimation[rIndex].HoleFilledCells.length; i++)
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
//region Class Constructor Logic -------------------------------------------------------------------------------------> GraphicTileworld Constructor Begin
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

		//loading some texture maps
		_CL_Engine.getTextureManager().getTexture("./copperlichtdata/floor-cell-luz-filled.jpg", true);
		_CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-halo_bad.png", true);
		_CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp_bad.png", true);
		_CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_broken_diffuse_map.png", true);
		_CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonocore-red.png", true);
		_CL_Engine.getTextureManager().getTexture("./copperlichtdata/spotlight_full_score.png", true);

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
				_CL_Floor[irow][icolumn] = 	[
											cond||!_LOW_QUALITY_GRID? _CLN_FloorCellBase.createClone(_CL_Scene.getRootSceneNode()) : _CLN_FloorCellBase,
											_CLN_FloorCellTop.createClone(_CL_Scene.getRootSceneNode())
											];
				_CL_Floor[irow][icolumn][0].Pos.X = _CL_Floor[irow][icolumn][1].Pos.X = GraphicTileworld.RowIndexToXPosition(irow);
				_CL_Floor[irow][icolumn][0].Pos.Z = _CL_Floor[irow][icolumn][1].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(icolumn);

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

		_CLN_LaserGlow = _CL_Scene.getSceneNodeFromName('laserbeam-light');
		_CLN_LaserGlow.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/laserbeam-ufo.png", true);

		_CLN_UFO = _CL_Scene.getSceneNodeFromName('ufo');
		_CLN_UFO.getMaterial(11).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/transp.png", true);
		_CLN_UFO.getMaterial(11).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
		_CLN_UFO.Rot.X = -30;
		_CLN_UFO.Stop = false;
		_ShipFlyCenter.setTo(_CLN_FloorBase.Pos);
		_ShipFlyRadius = Math.max(_ROWS, _COLUMNS-1)*_FloorCellSize/2;
		if (_ShipFlyRadius >= 80)
			_ShipFlyRadius = 80;

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

		for (rob= 0; rob < _NUMBER_OF_ROBS; ++rob){
			if (rob == 0){
				_CLN_Rob[0] = _CL_Scene.getSceneNodeFromName('rob');
			}else{
				_CLN_Rob[rob] = _CLN_Rob[0].createClone(_CLN_Rob[0].getParent());
			}

			_self.Rob[rob] = new GraphicRob(_CLN_Rob[rob], _self, rob);

			for (var iteam = _TEAMS.length-1; iteam >= 0; --iteam)
				if (_TEAMS[iteam].MEMBERS[0] == rob){

					$("#robs-hud").append(
						'<span id="rob-'+rob+'" style="display: list-item; height: 36px; '+(Tileworld.Battery?'padding: 13px 4px;':'padding-bottom: 10px; padding-right: 4px;')+'">'+
							(_NUMBER_OF_ROBS > 1? '<span id="tm-'+rob+'-logo"'+((_TEAMS[iteam].MEMBERS.length > 1)? 'class="rotate90"' :'')+' style="float: right; font-family: airstrike; margin-right: 13px; margin-top: -3px; height: 40px; width: 34px; font-size: 34px; background: url(\'./copperlichtdata/tm' + iteam + '.png\') no-repeat; background-size: contain; padding-right: 5px; text-align: center;">'+((_TEAMS[iteam].MEMBERS.length == 1)? rob : '')+'</span>':'')+
							(Tileworld.Battery? '<span id="battery-parent" style="float:right; margin: -3px 15px 0 -35px; text-shadow: 0px 0px 10px cyan;">'+
								'<span style="float: right; margin-top: 13px; margin-right: -4px; width: 5px; height: 16px; background-color: rgba(255, 255, 255, 0.35); border-radius: 0 5px 5px 0;"></span>'+
								'<span id="battery-charge-frame" style="overflow: hidden; float: right; margin-top: 6px; margin-right: 1px; width: 60px; height: 30px; background-color: rgba(255, 255, 255, 0.35); border-radius: 6px; box-shadow: 0 0 10px rgba(87, 255, 168, 0.57);">'+
									'<div id="battery-charge" style="background-color: rgb(76, 218, 100); background-image:url(imgs/battery-background.png); height:100%; width: 100%"></div>'+
								'</span>'+
								'<span id="battery-percent" class="rotate90" style="float: right; margin-top: 14px; font-size: 10px; text-shadow: 0 0 6px black;">100.0%</span>'+
							'</span>' : '') +
							'<span id="score-parent" style="float:right; font-size:20px; margin-right: '+(Tileworld.Battery?'40px; margin-top: 10px':(_NUMBER_OF_ROBS > 1?'5px':'20px'))+'; font-family: airstrike; text-shadow: 0px 0px 10px rgba(157, 248, 255, 0.66); color: rgb(255, 105, 0)">'+
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

		var wonC=[], lostC=[], $goalsTable = $("#table-goals");
		for (cond in _GAMEOVER)
			if (_GAMEOVER[cond].VALUE && _GAMEOVER[cond].OUTCOME == _GAME.WON)
				wonC.push(cond);
			else
			if (_GAMEOVER[cond].VALUE && _GAMEOVER[cond].OUTCOME == _GAME.LOST)
				lostC.push(cond);

		if (wonC.length > 0){
			$goalsTable.append('<tr><th></th><th style="color: rgb(0, 255, 72);">Objetivos:</th></tr>');
			for (var c= 0; c < wonC.length; ++c)
				$goalsTable.append('<tr><td><img id="'+_GAMEOVER[wonC[c]].$ID+'" src="imgs/goal.png"/></td><td>'+sprintf(_GAMEOVER[wonC[c]].$TEXT, _GAMEOVER[wonC[c]].VALUE) +"</td></tr>");
			$goalsTable.append('<tr style="height:10px"><td></td><td></td></tr>');
		}

		if (lostC.length > 0){
			$goalsTable.append('<tr><th></th><th style="color: rgb(255, 0, 30);">Pierdes al:</th></tr>');
			for (var c= 0; c < lostC.length; ++c)
				$goalsTable.append('<tr><td><img src="imgs/go-mark.png"/></td><td>'+sprintf(_GAMEOVER[lostC[c]].$TEXT, _GAMEOVER[lostC[c]].VALUE)+"</td></tr>");
			$goalsTable.append('<tr style="height:10px"><td></td><td></td></tr>');
		}

		if (lostC.length + wonC.length > 0)
			$("#playPauseBtn").css("left", $("#table-goals").width()+"px").css("margin-left", "0");

		if (_NUMBER_OF_ROBS > 1)
			for (var backIcon, teamIcon, playerIcon, rob= 0; rob < _NUMBER_OF_ROBS; ++rob){
				backIcon = new CL3D.BillboardSceneNode();
				backIcon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-background.png", true);
				backIcon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
				backIcon.SizeX = backIcon.SizeY = 8;
				backIcon.Pos.set(0, 28, 0);

				teamIcon = new CL3D.BillboardSceneNode();
				teamIcon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tm" + _GET_TEAM_INDEX_OF(rob) + ".png", true);
				teamIcon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
				teamIcon.SizeX = teamIcon.SizeY = 4;
				teamIcon.Pos.set(0, 28, 0);

				playerIcon = new CL3D.BillboardSceneNode();
				playerIcon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/p" + rob + ".png", true);
				playerIcon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
				playerIcon.SizeX = playerIcon.SizeY = 4;
				playerIcon.Pos.set(0, 28, 0);

				_CLN_Rob[rob].addChild(playerIcon);
				_CLN_Rob[rob].addChild(backIcon);
				_CLN_Rob[rob].addChild(teamIcon);
			}

		_clOnAnimateCallBack = _CL_Scene.getRootSceneNode().OnAnimate;
		_CL_Scene.getRootSceneNode().OnAnimate = display;

		_CLNs_setMinimalUpdateDelay(_FPS - _MINIMAL_UPDATE_DELAY);

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

		if (!Tileworld.Battery)
			_CL_Scene.getSceneNodeFromName('battery-charger-icon').setVisible(false);

		if (_FULL_WINDOW_RENDER)
			fullWindowRender();

		_self.Environment.onLoadingCompleteCallback();

		//region User Input Handler

			//Pause Button
			$("#pauseBtn").mouseenter(function(e){
				$("#pauseBtn").prop("src", "imgs/pause_enter.png");
			});
			$("#pauseBtn").mouseleave(function(e){
				$("#pauseBtn").prop("src", "imgs/pause.png");
			});
			$("#pauseBtn").mouseup(function(e){_togglePause()});
			$("#playPauseBtn").mousedown(function(e){_togglePause()});
			$("#playPauseBtn").mouseenter(function(e){$(this).prop("src", "imgs/play_enter.png")});
			$("#playPauseBtn").mouseleave(function(e){$(this).prop("src", "imgs/play.png")});

			//Camera Button
			$("#cameraBtn").mouseenter(function(e){
				$("#cameraBtn").prop("src", "imgs/camera_enter.png");
			});
			$("#cameraBtn").mouseleave(function(e){
				$("#cameraBtn").prop("src", "imgs/camera.png");
			});
			$("#cameraBtn").mouseup(function(e){
				_self.toggleCamera();
			});

			_GUI.ON_GAME_SCREEN.$ = $("#on-game-screen");
			_GUI.ON_GAME_SCREEN.MARGIN_TOP = -(_GUI.ON_GAME_SCREEN.$.height()/2|0)+"px";
			_GUI.ON_GAME_SCREEN.LEFT = -_GUI.ON_GAME_SCREEN.$.width()+"px";
			_GUI.ON_GAME_SCREEN.$
				.css("margin-top",_GUI.ON_GAME_SCREEN.MARGIN_TOP)
				.css("left", _GUI.ON_GAME_SCREEN.LEFT);

			$(window).blur(function() {
				if (!_Paused)
					_togglePause();
			});

			//-> mouseWheel Event Handler
			$(document).mousewheel(
				function(event, delta){
					var _newRadius;
					_cameraShakingFlag = false;

					if (_CL_ActiveCamera.getAnimators()[0]){
						_newRadius = _cameraFinalRadius - delta*(_cameraFinalRadius)/40;

						if ( 11 <= _newRadius && _newRadius <= 1915){
							if (!_Running)
								$('#tileworld').removeClass("blur");
							_cameraFinalRadius= _newRadius;
							_CL_CameraModelViewer.RotateSpeed = _CL_CameraModelViewer.Radius*6;
							_AnimationFactor = 10;
							_cameraAnimationFlag = 2;
						}else
							if (!_Running)
								$('#tileworld').addClass("blur");
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
			);

			$(window).mousedown(function(e){
				if (e.which == 3)
					if (!_Paused)
						_togglePause();
			});

			//-> keydown Event Handler
			$(window).keydown(function(e){
				//console.log(e.keyCode);
				if (isValidKey(e.keyCode)){
					switch(e.keyCode){
						case 32://space bar
							//_SHOW_HOLES_HELPERS = true;
							_SHOW_HOLES_HELPERS = !_SHOW_HOLES_HELPERS;
							_toggleHolesHelpersVisible();
							break;
						case 13:
						case 27://Escape
							_togglePause();
							break;
						case 67://C
							_self.toggleCamera();
							break;
						case 70://F
							fullScreen(document.body);
							break;
						case 16://shift
							_toggleOnScreenInfo(true);
					}
				}
			});

			//-> keyUp Event Handler
			$(window).keyup(function(e){
				if (isValidKey(e.keyCode)){
					switch(e.keyCode){
						case 107://+
							buzz.all().increaseVolume(25);
							break;
						case 109://-
							buzz.all().decreaseVolume(25);
							break;
						case 16://shift
							_toggleOnScreenInfo(false);
							break;
						/*case 32://space bar
							_SHOW_HOLES_HELPERS = false;
							_toggleHolesHelpersVisible();
							break;*/
					}
				}
			});
		//end region User Input Handler
	}

	if (_AUDIO_ENABLE)
		buzz.all().setVolume(_VOLUME_LEVEL);
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

	buf.Vertices[0] = createVertex(x - hSize, y, z + hSize);
	buf.Vertices[1] = createVertex(x + hSize, y, z + hSize);
	buf.Vertices[2] = createVertex(x + hSize, y, z - hSize);
	buf.Vertices[3] = createVertex(x - hSize, y, z - hSize);

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

	buf.Vertices[0] = createVertex(srcP.X + hSize, srcP.Y, srcP.Z, 1, 1);
	buf.Vertices[1] = createVertex(srcP.X - hSize, srcP.Y, srcP.Z, 0, 0);
	buf.Vertices[2] = createVertex(destP.X - hSize, destP.Y-20, destP.Z, 0, 1);
	buf.Vertices[3] = createVertex(destP.X + hSize, destP.Y-20, destP.Z, 1, 0);

	buf.Vertices[4] = createVertex(srcP.X, srcP.Y, srcP.Z + hSize, 1, 1);
	buf.Vertices[5] = createVertex(srcP.X, srcP.Y, srcP.Z - hSize, 0, 0);
	buf.Vertices[6] = createVertex(destP.X, destP.Y-20, destP.Z - hSize, 0, 1);
	buf.Vertices[7] = createVertex(destP.X, destP.Y-20, destP.Z + hSize, 1, 0);

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
function createVertex(x, y, z, s, t)
{
	var vtx = new CL3D.Vertex3D(true);

	vtx.Pos.X = x;
	vtx.Pos.Y = y;
	vtx.Pos.Z = z;
	vtx.TCoords.X = s;
	vtx.TCoords.Y = t;

	return vtx;
}