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
					var _FloorCellSize = 10;
					var _HoleCellAlpha = 0.4; // from 0 to 1
					var _LaserBeamLifeTime = _FPS; //frames
					var _BatteryIconY = 10;//30;

					//Ship Fly Cricle Animation
					var _ShipFlySpeed = 0.02;//0.01;
					var _ShipFlyRadius = 70;
					var _ShipFlyCenter = new CL3D.Vect3d(10, 50, 80);
				//end region World Parameters

				var _CL_Engine = graphicEngine;
				var _CL_Scene;
				var _CL_Canvas = _CL_Engine.getRenderer().getWebGL().canvas; //used for calculatin the x and y-scale when animating the score
				var _CL_OnTheFloor 	= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
				var _CL_HoleHelpers = newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
				var _CL_LaserBeams = new Array();
				var _CL_Floor 		= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
				var _CLN_Ship;
				var _CLN_BatteryIcon;
				var _CLN_BatteryElect;

				var _self = this;

				var _holeFilledCells = null;
				var _holeIsFilled = false;

				var _floorLimits = new Object();

				var _clOnAnimateCallBack; //for keeping a pointer to the original CopperLitch onAnimate function

				//used for camara animation
				var _CL_ActiveCamera;
				var _cameraXPosOffset; // Auxiliary variable used to achieve the follow-Rob camera's 'smooth movement'
				var _cameraZPosOffset; // Auxiliary variable used to achieve the follow-Rob camera's 'smooth movement'

				//sounds
				if (_AUDIO_ENABLE){
					var _sound_ufo_laser = new buzz.sound("./sounds/laser.mp3").loop();
					var _sound_ufo_laser_short = new buzz.sound("./sounds/laser-short.mp3");
					var _sound_teleport = new buzz.sound("./sounds/teleport.mp3");
					var _sound_teleport_bad = new buzz.sound("./sounds/teleport_bad.mp3");
					var _sound_score_light = new buzz.sound("./sounds/score.mp3");
					var _sound_score_full = new buzz.sound("./sounds/score-full.mp3");
				}

				//temporary
					var _points;
			//public

				this.currentFPS = _FPS;
				this.Environment = environment;
				this.Rob;
		//end region Attributes
		//
		//region Methods
			//region Public
				//region Getters And Setters
					this.getActiveCamera = function() {return _CL_ActiveCamera;}
					this.getFloorCellSize = function() {return _FloorCellSize;}
					this.getFloorLimits = function() {return _floorLimits;}
					this.getCLEngine = function() {return _CL_Engine;}
					this.getOnTheFloorMatrix = function() {return _CL_OnTheFloor;}
					this.getNodeOnTheFloorAt = function(row, column) {
						return _CL_OnTheFloor[row][column];
					}

					this.setRobLocation = function(row, column) {
						if (this.Rob)
							this.Rob.setXZ(row*_FloorCellSize + _floorLimits.X0, column*_FloorCellSize);
					}

					this.setBatteryChargerLocation = function(row, column){
						_CLN_BatteryIcon.Pos.X = GraphicTileworld.RowIndexToXPosition(row);
						_CLN_BatteryIcon.Pos.Z = GraphicTileworld.ColumnIndexToZPosition(column);

						_CLN_BatteryIcon.setVisible(true);

						_CL_Floor[row][column][1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_battery.png", true);
						_CL_Floor[row][column][0].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_battery.png", true);;

						_CLN_BatteryElect = _CL_Scene.getSceneNodeFromName('obstacle').createClone(_CL_Scene.getSceneNodeFromName('dummy'));
						_CLN_BatteryElect.Pos.X = GraphicTileworld.RowIndexToXPosition(row);
						_CLN_BatteryElect.Pos.Z = GraphicTileworld.ColumnIndexToZPosition(column);
						_CLN_BatteryElect.Scale.Y = 3;
						_CLN_BatteryElect.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/battery-elec.png", true);
						_CLN_BatteryElect.setVisible(true);
					}

					this.batteryCharge
				//end region Getters And Setters
				//
				//region Static
					//--------------------------------------------------------------------------------------------------------------------> RowIndexToXPosition
					GraphicTileworld.RowIndexToXPosition = function(irow) {return (irow*_FloorCellSize - _CL_Floor.length*_FloorCellSize/2);}

					//--------------------------------------------------------------------------------------------------------------------> ColumnIndexToZPosition
					GraphicTileworld.ColumnIndexToZPosition = function(icolumn) {return (icolumn*_FloorCellSize);}

					//--------------------------------------------------------------------------------------------------------------------> updateScreenResolution
					GraphicTileworld.UpdateScreenResolution = function(height, width){_CL_Canvas.height = height; _CL_Canvas.width = width;}
				//end region Static

				this.updateScore = function(_score, holeCells, filled, points) {

					_holeIsFilled = filled;
					_holeFilledCells = new Array();

					for (var i=0; i < holeCells.length; i++){
						_holeFilledCells.push([
							GraphicTileworld.RowIndexToXPosition(holeCells[i][0]),
							GraphicTileworld.ColumnIndexToZPosition(holeCells[i][1])
						]);
					}

					_points = points;

					$("#score").html(_score);

					if (filled){
						if (_AUDIO_ENABLE)
							_sound_score_full.play();

						$("#frameColor").show();
						$("#frameColor").css({opacity: 0.5 , 'background-color' : 'rgb(255,255,255)'});
						$("#frameColor").animate({opacity:0}, 1000, function(){$("#frameColor").hide();});
					}
				}

				this.batteryChargeAnimation = function(out){
					if (out)
						_CLN_BatteryElect.Scale.Y = 3;
					else{
						_CLN_BatteryElect.setCurrentFrame(0);
						_CLN_BatteryElect.Scale.Y = 5.8;
					}
				}

				//------------------------------------------------------------------------------------------------------------------------> newTile
				this.newTile = function(tileCell){
					var _CLN_Tile = _CL_Scene.getSceneNodeFromName('tile').createClone(_CL_Scene.getSceneNodeFromName('dummy-tile'));
					this.removeTile(tileCell);

					_CL_OnTheFloor[tileCell[0]][tileCell[1]] = _CLN_Tile;
					_CLN_Tile.Pos.X = GraphicTileworld.RowIndexToXPosition(tileCell[0]);
					_CLN_Tile.Pos.Z = GraphicTileworld.ColumnIndexToZPosition(tileCell[1]);
					_CLN_Tile.setVisible(true);

					_CL_Floor[tileCell[0]][tileCell[1]][0].setVisible(true);
					_CL_Floor[tileCell[0]][tileCell[1]][1].setVisible(true);

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

							_CLN_Ship.Stop = true;
							laser = new CL3D.LaserBeam(
								_CL_Tile.Pos,
								new CL3D.Vect3d(_CLN_Ship.Pos.X,_CLN_Ship.Pos.Y-20,_CLN_Ship.Pos.Z),
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
						_CL_Floor[row][column][0].setVisible(false);
						_CL_Floor[row][column][1].setVisible(false);

						if (_CL_HoleHelpers[row][column])
							_CL_Scene.getSceneNodeFromName('layer1').removeChild(_CL_HoleHelpers[row][column]);

						_CL_HoleHelpers[row][column] = new CL3D.HoleCellHelper(0,0.2,0,_FloorCellSize,_CL_Engine, r, g, b, _HoleCellAlpha);
						_CL_HoleHelpers[row][column].Pos.X = GraphicTileworld.RowIndexToXPosition(row);
						_CL_HoleHelpers[row][column].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(column);
						_CL_HoleHelpers[row][column].setVisible(_SHOW_HOLES_HELPERS);

						_CL_Scene.getSceneNodeFromName('layer1').addChild(_CL_HoleHelpers[row][column]);

						//laser beams
						_CLN_Ship.Stop = true;
						laser = new CL3D.LaserBeam(
							_CL_Floor[row][column][1].Pos,
							new CL3D.Vect3d(_CLN_Ship.Pos.X,_CLN_Ship.Pos.Y-20,_CLN_Ship.Pos.Z),
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

					_CLN_FloorCell[0].setVisible(true);
					_CLN_FloorCell[1].setVisible(true);

					if (isTeleported){
						_CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp_bad.png", true);
						this.showTeleport(_CLN_FloorCell, false, true);
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
					_CLN_Ship.Stop = true;
					laser = new CL3D.LaserBeam(
						_CLN_FloorCell[1].Pos,
						new CL3D.Vect3d(_CLN_Ship.Pos.X,_CLN_Ship.Pos.Y-20,_CLN_Ship.Pos.Z),
						_CL_Engine,
						_LaserBeamLifeTime
					);

					if (_AUDIO_ENABLE)
						_sound_ufo_laser.play();
					_CL_LaserBeams.push(laser);
				}

				//------------------------------------------------------------------------------------------------------------------------> removeObstacle
				this.removeObstacle = function(cell){
					var _CLN_FloorCell = _CL_Floor[cell[0]][cell[1]];

					_CL_Scene.getSceneNodeFromName('dummy').removeChild(_CL_OnTheFloor[cell[0]][cell[1]]);
					_CL_OnTheFloor[cell[0]][cell[1]] = null;

					_CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
					_CLN_FloorCell[1].getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
					_CLN_FloorCell[0].getMaterial(0).Tex1 = _CLN_FloorCell[1].getMaterial(0).Tex1;

					this.showTeleport(_CLN_FloorCell, false);
				}

				//------------------------------------------------------------------------------------------------------------------------> 
				this.fillHole = function(holeCell){

					var CL_Tile = _CL_OnTheFloor[holeCell[0]][holeCell[1]];

					this.Environment.getListOfTilesToSlide().remove(holeCell[0], holeCell[1]);

					if (CL_Tile){
						CL_Tile.setMinimalUpdateDelay(
							(_AUTO_MINIMAL_UPDATE_DELAY)?
								((_self.currentFPS <= _FPS)? _FPS - _self.currentFPS : 0)
								:
								_MINIMAL_UPDATE_DELAY
						);

						CL_Tile.setLoopMode(false);
						CL_Tile.setAnimation('fill');
						CL_Tile.Rot.Y = this.Rob.getCLNode().Rot.Y;

						CL_Tile.CL_FloorCell = _CL_Floor[holeCell[0]][holeCell[1]];
						CL_Tile.CellToBeFilled = holeCell;
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
					//Rob's animation
					_self.Rob.animate();

					//UFO animation
					ShipFlyCircle();
					_CLN_Ship.Rot.Y = CL3D.radToDeg(Math.atan2(_CLN_Ship.Pos.X- _self.Rob.getCLNode().Pos.X, _CLN_Ship.Pos.Z - _self.Rob.getCLNode().Pos.Z));

					//Camera animation
					if (_Running){
						if (_CAMERA_SMOOTH){
							_cameraXPosOffset = (_self.Rob.getCLNode().Pos.X - _CL_ActiveCamera.getTarget().X)/40;
							_cameraZPosOffset = (_self.Rob.getCLNode().Pos.Z - _CL_ActiveCamera.getTarget().Z)/40;

							if (Math.abs(_cameraXPosOffset) > 0.05){
								_CL_ActiveCamera.Pos.X += _cameraXPosOffset;
								_CL_ActiveCamera.getTarget().X += _cameraXPosOffset;
							}

							if (Math.abs(_cameraZPosOffset) > 0.05){
								_CL_ActiveCamera.Pos.Z += _cameraZPosOffset;
								_CL_ActiveCamera.getTarget().Z += _cameraZPosOffset;
							}
						}else{
							_CL_ActiveCamera.getTarget().X = _self.Rob.getCLNode().Pos.X;
							_CL_ActiveCamera.getTarget().Z = _self.Rob.getCLNode().Pos.Z;
						}
					}

					//region laser beams animation
						if (_CL_LaserBeams.length == 0){
							if (_AUDIO_ENABLE)
								_sound_ufo_laser.stop();

							_CL_Scene.getSceneNodeFromName('laserbeam-light').setVisible(false);
							_CLN_Ship.Stop = false;
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
							this.oldCurrentTime = currentTime;
						}

						this.framesCounter = (this.framesCounter+1)%_FPS;
						this.currentFPSCounter = (this.currentFPSCounter + 1)%_self.currentFPS;

						if (this.framesCounter == 0){
							_self.currentFPS = parseInt(_FPS/((currentTime - this.oldCurrentTime)/1000)); 
							_LaserBeamLifeTime = _self.currentFPS;

							//auto calculate Rob's movements speed according to user's PC performance (current fps)
							_self.Environment.Durations.moves = _self.Rob.autoCalculateSpeed(_self.currentFPS);
							_self.Environment.Durations.moves = (Math.ceil(_FloorCellSize/_self.Environment.Durations.moves)/_self.currentFPS).toFixed(2);
							
							if (_AUTO_MINIMAL_UPDATE_DELAY)
								_CLNs_setMinimalUpdateDelay(_self.currentFPS);

							if (_SHOW_FPS)
								$("#fps").html(_self.currentFPS + " fps");

							//waiting for the fps to stabilize
							if (!_Ready){
								if (_self.currentFPS > this.oldCurrentFPS)
									this.oldCurrentFPS = _self.currentFPS;
								else
									_Ready = true;
							}

							this.oldCurrentTime = currentTime;
						}
					//end region fps calculation

					//every second let the environment to know a second has passed...
					if (this.currentFPSCounter  == 0)
						_self.Environment.tick();

					//CL graphicEngine I let you do your stuff! (calling the original onAnimate function)
					_clOnAnimateCallBack.apply(this, [CL_Scene, currentTime]);
				}

				function _CLNs_setMinimalUpdateDelay(frames){
						frames = (frames <= _FPS)? _FPS - frames : 0;

						_CL_Scene.getSceneNodeFromName('ufo').setMinimalUpdateDelay(frames);
						_CL_Scene.getSceneNodeFromName('astromaxi').setMinimalUpdateDelay(frames);
						_CL_Scene.getSceneNodeFromName('laserbeam-hit').setMinimalUpdateDelay(frames);
						_CL_Scene.getSceneNodeFromName('laserbeam-strong-hit').setMinimalUpdateDelay(frames);
						_CL_Scene.getSceneNodeFromName('tp-halo').setMinimalUpdateDelay(frames);
						_CL_Scene.getSceneNodeFromName('holefilled-light').setMinimalUpdateDelay(frames);

						_self.Rob.setMinimalUpdateDelay(frames);
				}

				function _toggleHolesHelpersVisible(visible){
					//O(n^2)
					for (var irow= 0; irow < _CL_HoleHelpers.length; irow++)
						for (var icolumn= 0; icolumn < _CL_HoleHelpers[0].length; icolumn++)
							if (_CL_HoleHelpers[irow][icolumn])
								_CL_HoleHelpers[irow][icolumn].setVisible(_SHOW_HOLES_HELPERS);
				}

				function ShipFlyCircle() {
					if (!_CLN_Ship.Stop){
						if (!this.Time){
							this.Time = 1;
							this.VecU = new CL3D.Vect3d(-1,0,0);
							this.VecV = new CL3D.Vect3d( 0,0,1);
							this.VecT0 = new CL3D.Vect3d();
							this.VecT1 = new CL3D.Vect3d();
							_CLN_Ship.Pos.setTo(_ShipFlyCenter);
							_ShipFlyRadius /=2;
						}else
							this.Time++;

						if(this.Time!=0){
							var b=this.Time*_ShipFlySpeed;

							this.VecT0.setTo(this.VecU).multiplyThisWithScal(Math.cos(b)).addToThis(this.VecT1.setTo(this.VecV).multiplyThisWithScal(Math.sin(b)));

							this.VecT0.multiplyThisWithScal(_ShipFlyRadius + Math.cos(this.Time/1000)*_ShipFlyRadius);
							_CLN_Ship.Pos.setTo(_ShipFlyCenter).addToThis(this.VecT0);

							_CLN_Ship.Pos.Y = 60 + Math.sin(this.Time/50)*15;
							if (Tileworld.Battery)
								_CLN_BatteryIcon.Pos.Y = _BatteryIconY + (_CLN_Ship.Pos.Y - 60)/8;
						}
					}
				}

				function showExplosion(pos) {
					var explosion = _CL_Scene.getSceneNodeFromName('laserbeam-strong-hit').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (garbage!!)

					if (_AUDIO_ENABLE)
						_sound_ufo_laser_short.play();

					explosion.Pos = pos;
					explosion.Rot.Y = to180Degrees(random(0,360));
					explosion.setCurrentFrame(0);
					explosion.setLoopMode(true);
					explosion.setVisible(true);

					explosion.OriginalOnAnimate = explosion.OnAnimate;
					explosion.OnAnimate = CL_Explosion_OnAnimate;
				}

				this.showTeleport = function(node, isTile, isRed) {
					var tpHalo= _CL_Scene.getSceneNodeFromName('tp-halo').createClone(_CL_Scene.getSceneNodeFromName('dummy-tile'));//TODO: could be improved (garbage!!)

					tpHalo.Pos.X = (isTile)? node.Pos.X : node[0].Pos.X;
					tpHalo.Pos.Z = (isTile)? node.Pos.Z : node[0].Pos.Z;
					tpHalo.Rot.Y = to180Degrees(random(0, 360));

					if (!isTile){
						tpHalo.Pos.Y = -8;
						node[0].getMaterial(1).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonocore.png", true);
					}

					if (isRed){
						tpHalo.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-halo_bad.png", true);
						tpHalo.getMaterial(1).Tex1 = tpHalo.getMaterial(0).Tex1;

						if (_AUDIO_ENABLE)
							_sound_teleport_bad.play();
					}else
						if (_AUDIO_ENABLE)
							_sound_teleport.play();

					tpHalo.setAnimation("halo");
					tpHalo.setCurrentFrame(0);
					tpHalo.setVisible(true);

					tpHalo.Node = node;
					tpHalo.IsTile = isTile;
					tpHalo.OriginalOnAnimate = tpHalo.OnAnimate;
					tpHalo.OnAnimate = CL_TPHalo_OnAnimate;
				}

				this.showHoleFilledLight = function(pair /*[x,z]*/) {
					var light= _CL_Scene.getSceneNodeFromName('holefilled-light').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (garbage!!)
					var pos2d;

					light.Pos.X = pair[0];
					light.Pos.Z = pair[1];

					light.setAnimation("shine");
					light.setCurrentFrame(0);
					light.setVisible(true);

					if (_points > 0){
						pos2d = _CL_Engine.get2DPositionFrom3DPosition(light.Pos);
						$("#score-up").html(_points);
						$("#score-up").css({
							left: parseInt(pos2d.X*($(window).width()/_CL_Canvas.width))+'px', // x*(width/origWidth) to respect the x-scale (when window is resized)
							top: parseInt(pos2d.Y*($(window).height()/_CL_Canvas.height))+'px',// y*(height/origHeight) to respect the y-scale (when window is resized)
							'font-size' : $("#tileworld").height()*0.1+'px'
						});
						$("#score-up").show();
						$("#score-up").stop(true).animate(
							{left: $("#score").offset().left+'px', top: $("#score").offset().top+'px', fontSize: '30px'},
							1000,
							function(){
								$("#score-up").hide();
								$("#score").stop(true).animate({fontSize : '50px'},100).animate({fontSize: '30px'},600);
							}
						);
					}

					light.OriginalOnAnimate = light.OnAnimate;
					light.OnAnimate = CL_Light_OnAnimate;
				}

				function createHoleFilledAnimationLight() {
					if (_AUDIO_ENABLE){
						_sound_score_light.setPercent(0);
						_sound_score_light.play();
					}

					if (!_holeFilledCells) return null;

					for (var i=0, CLN_CellLight; i < _holeFilledCells.length; i++)
						_self.showHoleFilledLight(_holeFilledCells[i]);

					_holeFilledCells = null;

					// once the cell is filled Rob keep walking (if pushing a tile) or stop walking otherwise
					_self.Rob.getCLNode().setLoopMode(true);
					_self.Rob.getCLNode().setAnimation("walk");
				}

				function CL_Tile_OnAnimate(CL_Scene, current){
					if (this.getFrameNr() >= 177500){
						_self.removeTile(this.CellToBeFilled);
						this.CL_FloorCell[0].setVisible(true);
						this.CL_FloorCell[1].setVisible(true);

						if (!_holeIsFilled && !_self.Environment.getHoleBeingFilled().wasRemoved()) {
							this.CL_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
						}

						createHoleFilledAnimationLight();

						_self.Environment.holeFilled();
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
							this.Node.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map.png", true);
							this.Node.getMaterial(1).Tex1 = this.Node.getMaterial(0).Tex1;
							this.Node.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
							this.Node.getMaterial(1).Type = CL3D.Material.EMT_SOLID;
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
				var _CLN_FloorCellBase, _CLN_FloorCellTop, _CLN_FloorBase, _CLN_Tile, _CLN_Tube;
				var _CLN_Moon, _CLN_Planet;

				//_CL_Engine.ShowFPSCounter = true;
				_CL_Scene = _CL_Engine.getScene();

				if (!_CL_Scene)
					return;

				_CL_Scene.BackgroundColor = CL3D.createColor(255, 255, 255, 255);
				_CL_Scene.useCulling = true;

				_CL_ActiveCamera = _CL_Scene.getActiveCamera();

				//loading some texture maps
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/floor-cell-luz-filled.jpg", true);
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/tp-halo_bad.png", true);
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp_bad.png", true);
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_broken_diffuse_map.png", true);
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonocore-red.png", true);

				_CLN_FloorCellBase = _CL_Scene.getSceneNodeFromName('floor-cell-base');
				_CLN_FloorCellTop = _CL_Scene.getSceneNodeFromName('floor-cell-top');

				for (var irow= 0; irow < _CL_Floor.length; irow++)
					for (var icolumn= 0; icolumn < _CL_Floor[0].length; icolumn++){
						_CL_Floor[irow][icolumn] = 	[
													_CLN_FloorCellBase.createClone(_CL_Scene.getRootSceneNode()),
													_CLN_FloorCellTop.createClone(_CL_Scene.getRootSceneNode())
													];
						_CL_Floor[irow][icolumn][0].Pos.X = _CL_Floor[irow][icolumn][1].Pos.X = GraphicTileworld.RowIndexToXPosition(irow);
						_CL_Floor[irow][icolumn][0].Pos.Z = _CL_Floor[irow][icolumn][1].Pos.Z = GraphicTileworld.ColumnIndexToZPosition(icolumn);

						_CL_Scene.getSceneNodeFromName('layer1').addChild(_CL_Floor[irow][icolumn][0]);
						_CL_Scene.getSceneNodeFromName('layer1').addChild(_CL_Floor[irow][icolumn][1]);
					}
				_CLN_FloorCellBase.setVisible(false);
				_CLN_FloorCellTop.setVisible(false);

				_floorLimits.X0 = -(_CL_Floor.length)*_FloorCellSize/2;
				_floorLimits.X1 = (_CL_Floor.length-2)*_FloorCellSize/2;
				_floorLimits.Y0 = 0;
				_floorLimits.Y1 = _FloorCellSize*(_CL_Floor[0].length-1);

				_CLN_FloorBase = _CL_Scene.getSceneNodeFromName('floor-base');
				_CLN_FloorBase.Scale.X = _CL_Floor.length;
				_CLN_FloorBase.Scale.Z = _CL_Floor[0].length;
				_CLN_FloorBase.Pos.X = (_floorLimits.X0 + _floorLimits.X1)/2;
				_CLN_FloorBase.Pos.Z = (_floorLimits.Y0 + _floorLimits.Y1)/2;

				_CLN_Ship = _CL_Scene.getSceneNodeFromName('ufo');
				_CLN_Ship.Rot.X = -30;
				_CLN_Ship.Stop = false;
				_ShipFlyCenter.setTo(_CLN_FloorBase.Pos);
				_ShipFlyRadius = Math.max(_CL_Floor.length, _CL_Floor[0].length)*_FloorCellSize/2;

				_CLN_Tile = _CL_Scene.getSceneNodeFromName('tile');
				_CLN_Tile.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tilecell_diffuse_map_tp.png", true);
				_CLN_Tile.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
				_CLN_Tile.getMaterial(0).BackfaceCulling = true;
				_CLN_Tile.getMaterial(1).Tex1 = _CLN_Tile.getMaterial(0).Tex1;
				_CLN_Tile.getMaterial(1).Type = _CLN_Tile.getMaterial(0).Type;
				_CLN_Tile.Scale.X = _CLN_Tile.Scale.Z = 0.9;

				_CLN_Tube = _CL_Scene.getSceneNodeFromName('cylinder-solar-panel');
				_CLN_Tube.Pos.set(-5, -48, 0);
				_CLN_Tube.Scale.set(8, 1.8, 1);
				_CLN_Tube.Pos.Z = _CLN_FloorBase.Pos.Z + _CL_Floor.length*_FloorCellSize/2 + 45;
				_CLN_Tube.Rot.X = -60;

				_CL_Scene.getSceneNodeFromName('tp-halo').setLoopMode(false);
				_CL_Scene.getSceneNodeFromName('holefilled-light').setLoopMode(false);

				_self.Rob = new GraphicRob(_CL_Scene.getSceneNodeFromName('rob'), _self);

				_CL_Scene.getActiveCamera().getTarget().Y = 15;

				_clOnAnimateCallBack = _CL_Scene.getRootSceneNode().OnAnimate;
				_CL_Scene.getRootSceneNode().OnAnimate = display;

				_self.RobWalkNorth = _self.Rob.WalkNorth;
				_self.RobWalkSouth = _self.Rob.WalkSouth;
				_self.RobWalkEast = _self.Rob.WalkEast;
				_self.RobWalkWest = _self.Rob.WalkWest;

				if (!_RENDER_AUTO_SIZE)
					GraphicTileworld.UpdateScreenResolution(_RENDER_HEIGHT, _RENDER_WIDTH);

				_CLNs_setMinimalUpdateDelay(_FPS - _MINIMAL_UPDATE_DELAY);

				_CL_ActiveCamera.Pos.Y = 20;

				_CLN_BatteryIcon = _CL_Scene.getSceneNodeFromName('battery-charger-icon');
				if (!Tileworld.Battery)
					_CLN_BatteryIcon.setVisible(false);

				ShipFlyCircle();

				_CLN_Moon = new CL3D.BillboardSceneNode();
				_CLN_Moon.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/moon.png", true);
				_CLN_Moon.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
				_CLN_Moon.SizeX = 4000;
				_CLN_Moon.SizeY = 4000;
				_CLN_Moon.Pos.set(-1200, 1600, 2100);
				_CL_Scene.getSceneNodeFromName('layer1').addChild(_CLN_Moon);
				//_CL_Scene.getSceneNodeFromName('cielo').addChild(_CLN_Moon);

				_CLN_Planet = new CL3D.BillboardSceneNode();
				_CLN_Planet.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/planet.png", true);
				_CLN_Planet.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
				_CLN_Planet.SizeX = 200;
				_CLN_Planet.SizeY = 200;
				_CLN_Planet.Pos.set(500, 600, -400);
				_CL_Scene.getSceneNodeFromName('layer1').addChild(_CLN_Planet);

				_self.Environment.onLoadingCompleteCallback();

				//region User Input Handler
					//-> mouseWheel Event Handler
					$(document).mousewheel(
						function(event, delta){
							_CL_Scene.getActiveCamera().getAnimators()[0].Radius-= delta;
						}
					);

					//-> keydown Event Handler
					$(document).keydown(function(e){
						if (isValidKey(e.keyCode)){
							switch(e.keyCode){
								case 32://space bar
									_SHOW_HOLES_HELPERS = true;
									_toggleHolesHelpersVisible();
									break;
								case 27://Escape
									//togglePause();
									break;
							}
						}
					});

					//-> keyUp Event Handler
					$(document).keyup(function(e){
						if (isValidKey(e.keyCode)){
							switch(e.keyCode){
								case 107://+
									buzz.all().increaseVolume(25);
									break;
								case 109://-
									buzz.all().decreaseVolume(25);
									break;
								case 32://space bar
									_SHOW_HOLES_HELPERS = false;
									_toggleHolesHelpersVisible();
									break;
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
	var gl = engine.getRenderer().getWebGL();
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

	var fragment_shader_source = "\
		#ifdef GL_ES                                          \n\
		precision highp float;                                \n\
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
	var laserSrcLight;

	this.LifeTime = lifeTime;
	this.Mesh = new CL3D.Mesh();


	this.init();  // init scene node specific members

	// create a 3d mesh with one mesh buffer
	this.Mesh.AddMeshBuffer(buf);

	// set indices and vertices
	buf.Vertices = new Array(8);

	buf.Vertices[0] = createVertex(srcP.X + hSize, srcP.Y, srcP.Z, 1, 1);
	buf.Vertices[1] = createVertex(srcP.X - hSize, srcP.Y, srcP.Z, 0, 0);
	buf.Vertices[2] = createVertex(destP.X - hSize, destP.Y, destP.Z, 0, 1);
	buf.Vertices[3] = createVertex(destP.X + hSize, destP.Y, destP.Z, 1, 0);

	buf.Vertices[4] = createVertex(srcP.X, srcP.Y, srcP.Z + hSize, 1, 1);
	buf.Vertices[5] = createVertex(srcP.X, srcP.Y, srcP.Z - hSize, 0, 0);
	buf.Vertices[6] = createVertex(destP.X, destP.Y, destP.Z - hSize, 0, 1);
	buf.Vertices[7] = createVertex(destP.X, destP.Y, destP.Z + hSize, 1, 0);

	buf.Indices = [0,1,2, 2,3,0, 4,5,6, 6,7,4];

	// set the texture of the material
	buf.Mat.Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
	buf.Mat.Tex1 = engine.getTextureManager().getTexture("./copperlichtdata/laserbeam.jpg", true);

	buf.Mat.BackfaceCulling = false;

	//Laser Hits on the ground
	laserHit = scene.getSceneNodeFromName('laserbeam-hit').createClone(scene.getRootSceneNode());
	laserHit.Pos = srcP;
	laserHit.Rot.Y = to180Degrees(random(0, 360));
	laserHit.setLoopMode(true);
	laserHit.setCurrentFrame(0);
	laserHit.Visible = true;

	laserSrcLight = scene.getSceneNodeFromName('laserbeam-light');
	laserSrcLight.Pos = destP;
	laserSrcLight.Visible = true;

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