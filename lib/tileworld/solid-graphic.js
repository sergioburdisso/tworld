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





// TODOOOOOO: en crear lazer, obstaulo, y demas cambiar los [] por objetos existentes!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! (VER SI MEJORAN LOS FPS!!)






//Class  GraphicTileworld
function GraphicTileworld(graphicEngine, environment){
//region Attributes
			//-Static:

			//private:
				//region 3D World Parameters
					var _FloorCellSize = 10;
					var _HoleCellAlpha = 0.4; // from 0 to 1
					var _LaserBeamLifeTime = _FPS; //frames

					//Ship Fly Cricle Animation
					var _ShipFlySpeed = 0.02;//0.01;
					var _ShipFlyRadius = 70;
					var _ShipFlyCenter = new CL3D.Vect3d(10, 50, 80);
				//end region World Parameters

				var _CL_Engine = graphicEngine;
				var _CL_Scene;
				var _CL_Canvas = _CL_Engine.getRenderer().getWebGL().canvas; //used for calculatin the x and y-scale when animating the score
				var _CL_Floor 		= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
				var _CL_OnTheFloor 	= newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
				var _CL_HoleHelpers = newMatrix(environment.getGridDimension().Rows, environment.getGridDimension().Columns);
				var _CL_LaserBeams = new Array();
				var _CLN_Ship;

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
					var _utility;
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
					this.getNodeOnTheFloorAt = function(rowIndex, columnIndex) {
						return _CL_OnTheFloor[rowIndex][columnIndex];
					}

					this.setRobLocation = function(rowIndex, columnIndex) {
						if (this.Rob)
							this.Rob.setXZ(rowIndex*_FloorCellSize + _floorLimits.X0, columnIndex*_FloorCellSize);
					}
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
				this.updateScore = function(_score, holeCells, filled, utility) {

					_holeIsFilled = filled;
					_holeFilledCells = new Array();

					for (var i=0; i < holeCells.length; i++){
						_holeFilledCells.push([
							GraphicTileworld.RowIndexToXPosition(holeCells[i][0]),
							GraphicTileworld.ColumnIndexToZPosition(holeCells[i][1])
						]);
					}

					_utility = utility;

					$("#score").html(_score);

					if (filled){
						if (_AUDIO_ENABLE)
							_sound_score_full.play();

						$("#frameColor").show();
						$("#frameColor").css({opacity: 0.5 , 'background-color' : 'rgb(255,255,255)'});
						$("#frameColor").animate({opacity:0}, 1000, function(){$("#frameColor").hide();});
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
						_CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map_tp_Bad.png", true);
						this.showTeleport(_CLN_FloorCell, false, true);
					}
				}

				this.removeHoleHelper = function(holeCell){
					var _CLN_FloorCell = _CL_Floor[ holeCell[0] ][ holeCell[1] ];

					_CL_Scene.getSceneNodeFromName('layer1').removeChild(_CL_HoleHelpers[ holeCell[0] ][ holeCell[1] ]);
					_CL_HoleHelpers[ holeCell[0] ][ holeCell[1] ] = null;

					if (_CLN_FloorCell[1].getMaterial(0).Tex1 == _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map_tp.png", true))
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
					_CLN_FloorCell[0].getMaterial(1).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonoCore-red.png", true);
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

					_CLN_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map_tp.png", true);
					_CLN_FloorCell[1].getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
					_CLN_FloorCell[0].getMaterial(0).Tex1 = _CLN_FloorCell[1].getMaterial(0).Tex1;

					this.showTeleport(_CLN_FloorCell, false);
				}

				//------------------------------------------------------------------------------------------------------------------------> 
				this.fillHole = function(holeCell){

					var CL_Tile = _CL_OnTheFloor[holeCell[0]][holeCell[1]];
					var holeToBeFilled = holeCell;//[holeCell[0], holeCell[1]];
					var _CL_FloorCell = _CL_Floor[holeToBeFilled[0]][holeToBeFilled[1]];
					var originalOnAnime;

					this.Environment.getListOfTilesToSlide().remove(holeCell);

					if (CL_Tile){
						originalOnAnime = CL_Tile.OnAnimate;

						CL_Tile.setMinimalUpdateDelay(
							(_MINIMAL_UPDATE_DELAY == 0)?
								((_self.currentFPS <= _FPS)? _FPS - _self.currentFPS : 0)
								:
								_MINIMAL_UPDATE_DELAY
						);

						CL_Tile.setLoopMode(false);
						CL_Tile.setAnimation('fill');
						CL_Tile.Rot.Y = this.Rob.getCLNode().Rot.Y;

						CL_Tile.OnAnimate = function(CL_Scene, current){
							if (CL_Tile.getFrameNr() >= 177500){
								_self.removeTile(holeToBeFilled);
								_CL_FloorCell[0].setVisible(true);
								_CL_FloorCell[1].setVisible(true);

								if (!_holeIsFilled) {
									_CL_FloorCell[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map_tp.png", true);
								}

								createHoleFilledAnimationLight();

								_self.Environment.holeFilled();
							}else{
								originalOnAnime.apply(this, [CL_Scene, current]);
							}
						}
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
					if (!_Pause) {
						//Rob's animation
						_self.Rob.animate();

						//UFO animation
						ShipFlyCircle();
						_CLN_Ship.Rot.Y = CL3D.radToDeg(Math.atan2(_CLN_Ship.Pos.X- _self.Rob.getCLNode().Pos.X, _CLN_Ship.Pos.Z - _self.Rob.getCLNode().Pos.Z));

						//Camera animation
						if (_Ready){
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
							if (!this.framesCounter){
								_self.currentFPSCounter = _FPS
								this.framesCounter = 0;
								this.seconds = 0;
								this.lastFrames = currentTime;
							}

							this.framesCounter = (this.framesCounter+1)%_FPS;
							_self.currentFPSCounter = (_self.currentFPSCounter + 1)%_self.currentFPS;

							if (this.framesCounter == 0){
								_self.currentFPS = parseInt(_FPS/((currentTime - this.lastFrames)/1000)); 
								_LaserBeamLifeTime = _self.currentFPS;

								_self.Rob.autoCalculateSpeed(_self.currentFPS);
								
								if (_MINIMAL_UPDATE_DELAY == 0)
									_CLNs_setMinimalUpdateDelay(_self.currentFPS);

								if (_SHOW_FPS)
									$("#fps").html(_self.currentFPS + " fps");

								this.lastFrames = currentTime;
							}
						//end region fps calculation

						//every second let the environment to know a second has passed...
						if (_self.currentFPSCounter  == 0) // (this.framesCounter  == 0) <- one tick every 60 frames not every second (wrong XD)
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
							
							/*var a=this.VecU.multiplyWithScal(Math.cos(b)).add(this.VecV.multiplyWithScal(Math.sin(b)));

							a.multiplyThisWithScal(_ShipFlyRadius + Math.cos(this.Time/1000)*_ShipFlyRadius);
							_CLN_Ship.Pos=_ShipFlyCenter.add(a);*/
							this.VecT0.setTo(this.VecU).multiplyThisWithScal(Math.cos(b)).addToThis(this.VecT1.setTo(this.VecV).multiplyThisWithScal(Math.sin(b)));

							this.VecT0.multiplyThisWithScal(_ShipFlyRadius + Math.cos(this.Time/1000)*_ShipFlyRadius);
							_CLN_Ship.Pos.setTo(_ShipFlyCenter).addToThis(this.VecT0);

							_CLN_Ship.Pos.Y = 60 + Math.sin(this.Time/50)*15;
						}
					}
				}

				function showExplosion(pos) {
					var originalOnAnime;
					var explosion = _CL_Scene.getSceneNodeFromName('laserbeam-strong-hit').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (garbage!!)

					if (_AUDIO_ENABLE)
						_sound_ufo_laser_short.play();

					explosion.Pos = pos;
					explosion.Rot.Y = to180Degrees(random(0,360));
					explosion.setCurrentFrame(0);
					explosion.setLoopMode(true);
					explosion.setVisible(true);

					originalOnAnime = explosion.OnAnimate;

					explosion.OnAnimate = function(CL_Scene, current) {

						if (explosion.getFrameNr() >= explosion.getNamedAnimationInfo(0).End - 10400)
							_CL_Scene.getRootSceneNode().removeChild(explosion);
						else
							originalOnAnime.apply(this, [CL_Scene, current]);
					}
				}

				this.showTeleport = function(node, isTile, isRed) {
					var originalOnAnime;
					var tpHalo= _CL_Scene.getSceneNodeFromName('tp-halo').createClone(_CL_Scene.getSceneNodeFromName('dummy-tile'));//TODO: could be improved (garbage!!)

					tpHalo.Pos.X = (isTile)? node.Pos.X : node[0].Pos.X;
					tpHalo.Pos.Z = (isTile)? node.Pos.Z : node[0].Pos.Z;
					tpHalo.Rot.Y = to180Degrees(random(0, 360));

					if (!isTile){
						tpHalo.Pos.Y = -8;
						node[0].getMaterial(1).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonoCore.png", true);
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

					originalOnAnime = tpHalo.OnAnimate;

					tpHalo.OnAnimate = function(CL_Scene, current) {

						if (tpHalo.getFrameNr() >= tpHalo.getNamedAnimationInfo(0).End-1000){
							_CL_Scene.getSceneNodeFromName('dummy-tile').removeChild(tpHalo);

							if (isTile){
								node.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map.png", true);
								node.getMaterial(1).Tex1 = node.getMaterial(0).Tex1;
								node.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
								node.getMaterial(1).Type = CL3D.Material.EMT_SOLID;
							}else{
								node[1].getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_diffuse_map.png", true);
								node[1].getMaterial(0).Type = /*CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL*/CL3D.Material.EMT_SOLID;
								node[0].getMaterial(0).Tex1 = node[1].getMaterial(0).Tex1;
							}

						}else
							originalOnAnime.apply(this, [CL_Scene, current]);
					}
				}

				this.showHoleFilledLight = function(pair /*[x,z]*/) {
					var originalOnAnime;
					var light= _CL_Scene.getSceneNodeFromName('holefilled-light').createClone(_CL_Scene.getRootSceneNode());//TODO: could be improved (garbage!!)
					var pos2d;

					light.Pos.X = pair[0];
					light.Pos.Z = pair[1];

					light.setAnimation("shine");
					light.setCurrentFrame(0);
					light.setVisible(true);

					originalOnAnime = light.OnAnimate;

					pos2d = _CL_Engine.get2DPositionFrom3DPosition(light.Pos);
					$("#score-up").html(_utility);
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

					light.OnAnimate = function(CL_Scene, current) {

						if (light.getFrameNr() >= light.getNamedAnimationInfo(0).End-1000)
							_CL_Scene.getRootSceneNode().removeChild(light);
						else
							originalOnAnime.apply(this, [CL_Scene, current]);
					}
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
			//end region private
		//end region Methods
		//
		//region Class Constructor Logic -------------------------------------------------------------------------------------> GraphicTileworld Constructor Begin
			// (Once everything's loaded, let's pass to the creation of the whole 3D Scene)
			_CL_Engine.OnLoadingComplete = function(){
				var _CLN_FloorCellBase, _CLN_FloorCellTop, _CLN_FloorBase, /*_CLN_Score,*/ _CLN_Tile;

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
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map_tp_Bad.png", true);
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagoncell_broken_diffuse_map.png", true);
				_CL_Engine.getTextureManager().getTexture("./copperlichtdata/hexagonoCore-red.png", true);

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
				_CLN_Tile.getMaterial(0).Tex1 = _CL_Engine.getTextureManager().getTexture("./copperlichtdata/tileCell_Diffuse_Map_tp.png", true);
				_CLN_Tile.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL;
				_CLN_Tile.getMaterial(0).BackfaceCulling = true;
				_CLN_Tile.getMaterial(1).Tex1 = _CLN_Tile.getMaterial(0).Tex1;
				_CLN_Tile.getMaterial(1).Type = _CLN_Tile.getMaterial(0).Type;
				_CLN_Tile.Scale.X = _CLN_Tile.Scale.Z = 0.9;

				_CL_Scene.getSceneNodeFromName('cylinder-solar-panel').Pos.X = _CLN_FloorBase.Pos.X;
				_CL_Scene.getSceneNodeFromName('cylinder-solar-panel').Pos.Z = _CLN_FloorBase.Pos.Z;

				_CL_Scene.getSceneNodeFromName('tp-halo').setLoopMode(false);
				_CL_Scene.getSceneNodeFromName('holefilled-light').setLoopMode(false);

				_self.Rob = new GraphicRob(_CL_Scene.getSceneNodeFromName('rob'), _self);

				_CL_Scene.getActiveCamera().getTarget().Y = 15;

				_clOnAnimateCallBack = _CL_Scene.getRootSceneNode().OnAnimate;
				_CL_Scene.getRootSceneNode().OnAnimate = display;

				ShipFlyCircle();

				if (!_RENDER_AUTO_SIZE)
					GraphicTileworld.UpdateScreenResolution(_RENDER_HEIGHT, _RENDER_WIDTH);

				_CLNs_setMinimalUpdateDelay(_FPS - _MINIMAL_UPDATE_DELAY);

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
									togglePause();
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
				buzz.all().setVolume(100);
		//end region Class Constructor Logic
}