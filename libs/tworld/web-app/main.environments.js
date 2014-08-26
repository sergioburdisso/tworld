/*
* main.environments.js - 
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
(function(){
	var mod = angular.module("tworldEnvironments", []);


	var colors = []; for (color in _COLORS) colors.push(_COLORS[color]);
	var taskEnvironment;

	mod.controller("EnvController", ["$modal", '$location', function($modal, $location){
		var _self = this;
		var _selected = -1;

		this.taskEnvironments = updateEnvitonments();
		this.orderCond = "-date";
		this.allProps = true;
		this.page = 1;
		this.itemsPerPage = 10;
		this.query = {
			name:"",
			battery: false,
			prop: {
				fullyObservable: true,
				multiagent: false,
				deterministic: true,
				dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
				known: true
			}
		};

		this.setSelected = function(value){_selected = value}
		this.isSelected = function(value){return _selected == value}

		this.testIt = function(){
			var env = getEnvironmentByDate(_selected);
			saveKnobs(env, true);

			startTWorld()
		}

		this.open = function(){$location.url('/environments/view:'+_selected)}

		this.remove = function(){
			$modal.open({
				size: 'sm',
				templateUrl: 'yes-no-modal.html',
				controller: yesNoModalController,
				resolve:{
					title: function(){return 'Confirmation'}, 
					msg: function(){return 'Are you sure you want to delete this task environment?'}
				}
			})
			.result.then(function(){
				if (isTaskEnvironmentTrialsEmpty(_selected))
					_remove()
				else{
					$modal.open({
						size: 'sm',
						templateUrl: 'yes-no-modal.html',
						controller: yesNoModalController,
						resolve:{
							title: function(){return 'Confirmation'}, 
							msg: function(){return 'This task environment seems to have stats associate with it. If you delete it all trials and stats will be deleted as well. Are you sure you want to proceed?'}
						}
					}).result.then(_remove)
				}
			});
		}

		this.openRunModal = function(){
			$modal.open({
					size: 'lg',//size,
					templateUrl: 'run-modal.html',
					controller: runModalController,
					resolve:{
						taskEnv: function(){return getEnvironmentByDate(_selected)}, 
						agentProgs: function(){return []}
					}
				});
		}

		this.userFilter = function(task_env){
			var regEx = new RegExp(_self.query.name,"i");
			var p = _self.query.prop;
			return regEx.test(task_env.name) && (
					_self.allProps ||
					(
						_self.query.battery == task_env.battery &&
						p.fullyObservable == task_env.prop.fullyObservable &&
						p.multiagent == task_env.prop.multiagent &&
						p.deterministic == task_env.prop.deterministic &&
						p.dynamic == task_env.prop.dynamic &&
						p.known == task_env.prop.known
					)
			);
		}

		function _remove(){
			_self.taskEnvironments = updateEnvitonments();

			//remove trials
			removeTaskEnvironmentTrials(_selected);

			//remove from list
			removeEnvironmentByDate(_selected);
		}

	}]);

	mod.controller('EnvNewController', ['$scope', '$modal', '$location', 'taskEnv',
		function($scope, $modal, $location, taskEnv){
			var _next = false;
			var _self = this;
			var _default = {
					teams:{
						single: [],
						//0 competitive; 1 cooperative; 2 both
						comp: taskEnv.prop.multiagent && taskEnv.prop.multiagent_type==0?
								taskEnv.teams : [],
						coop: taskEnv.prop.multiagent && taskEnv.prop.multiagent_type==1?
								taskEnv.teams : [],
						coopComp: taskEnv.prop.multiagent && taskEnv.prop.multiagent_type==2?
								taskEnv.teams : []
					}
				}

			this.noTrials = isTaskEnvironmentTrialsEmpty;
			this.nTeam = 0;
			this.teamColors = colors;
			this.step = 0;
			this.end_game_cond = end_game_conditions = [
				{name:_ENDGAME.TIME.NAME				, value:5*60, result:_GAME_RESULT.NEUTRAL	},
				{name:_ENDGAME.AGENTS_LOCATION.NAME		, value:[]	, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.FILLED_HOLES.NAME		, value:0	, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.FILLED_CELLS.NAME		, value:0	, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.SCORE.NAME				, value:0	, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.GOOD_MOVES.NAME			, value:0	, result:_GAME_RESULT.NEUTRAL	},
				{name:_ENDGAME.BAD_MOVES.NAME			, value:0	, result:_GAME_RESULT.LOST		},
				{name:_ENDGAME.BATTERY_USED.NAME		, value:0	, result:_GAME_RESULT.LOST		},
				{name:_ENDGAME.BATTERY_RECHARGE.NAME	, value:0	, result:_GAME_RESULT.LOST		},
				{name:_ENDGAME.BATTERY_RESTORE.NAME		, value:0	, result:_GAME_RESULT.LOST		}
			];
			this.task_env = taskEnvironment = taskEnv;
			this.stochastic_model = taskEnv.agents.stochastic_model;
			this.stchastic_user_model = new Array(5);

			this.nextStep = function(){
				if (Validate()){
					this.step++; _next= true;
					gotoTop(0)
				}
			}	
			this.prevStep = function(){
				if (true){//Validate()){
					this.step--; _next= false;
					gotoTop(0)
				}
			}
			this.isStep = function(i){return this.step===i}
			this.isLastStep = function(){return this.step===6}
			this.correctStep = function(){if (_next) this.step++; else this.step--}

			this.loadConfig = function(){
				$modal.open({
					size: 'lg',
					templateUrl: 'items-list-modal.html',
					controller: itemsListController,
					resolve:{
						items:function(){return getEnvironments()},
						agentProgramsFlag:function(){return false}
					}
				})
				.result.then(function (id) {if(id != -1){
					updateEnvitonments();
					_self.task_env = taskEnvironment = clone(getEnvironmentByDate(id));
					_self.task_env.name+= " (copy)";
					_self.task_env.date = undefined;
				}});
			}

			this.finish = function(){
				this.validate();

				taskEnvironment.trial.test = false;

				updateEnvitonments();

				if (!taskEnvironment.date){
					taskEnvironment.date = Date.now();
					taskEnvironments.push(taskEnvironment);
				}else
					taskEnvironments[ getEnvironmentIndexByDate(taskEnvironment.date) ] = taskEnvironment;

				saveEnvironments();
				$location.url('/');
				gotoTop()
			}

			this.testEnvironment = function(){
				this.validate();
				saveKnobs(taskEnvironment, true);

				startTWorld()
			}

			this.validate = function(){
				_self.checkDistribution(taskEnvironment.environment.holes_size);
				_self.checkDistribution(taskEnvironment.environment.num_holes);
				_self.checkDistribution(taskEnvironment.environment.num_obstacles);
				_self.checkDistribution(taskEnvironment.environment.difficulty);
				_self.checkDistribution(taskEnvironment.environment.dynamic.dynamism);
				_self.checkDistribution(taskEnvironment.environment.dynamic.hostility);
			}

			this.isDeterministic = function(){return taskEnvironment.prop.deterministic}
			this.isDynamic = function(){return taskEnvironment.prop.dynamic === 2}
			this.isSemidynamic = function(){return taskEnvironment.prop.dynamic === 1}
			this.isRange = function(range){return range[0]!=range[1]}

			//PERCEPTION
			this.getTextVisibilityRadius = function(){
				var radius = this.task_env.agents.percept.radius;
				if (!radius)
					return "Unobservable environment";
				else
					return "Radius of " + radius + " cell" + (radius > 1? "s" : "");
			}

			//AGENT ACTUATOR

			this.isRefusesToMove = function()
			{return (_self.stochastic_model.type|0) === _STOCHASTIC_ACTIONS_MODEL.NO_ACTION}

			this.isOppositeMove = function()
			{return (_self.stochastic_model.type|0) === _STOCHASTIC_ACTIONS_MODEL.OPPOSITE_ACTION}

			this.isUsedDefined = function()
			{return (_self.stochastic_model.type|0) === _STOCHASTIC_ACTIONS_MODEL.USER_DEFINED}

			this.updateUserStochasticModel = function(index){
				var value = Number(_self.stchastic_user_model[index].replace(",","."));
				_self.stochastic_model.prob[index] = (value*10)|0;
			}

			this.updateStochasticModel = function(v){
				switch(_self.stochastic_model.type|0){
					case _STOCHASTIC_ACTIONS_MODEL.NO_ACTION:
						_self.stochastic_model.prob[1] =
						_self.stochastic_model.prob[2] =
						_self.stochastic_model.prob[3] = 0;
						_self.stochastic_model.prob[4] = 1000-v;
						break;

					case _STOCHASTIC_ACTIONS_MODEL.ANOTHER_ACTION:
						var total = (1000-v);
						var factor = total/3|0;
						for (var p= 1; p < 4; ++p)
							_self.stochastic_model.prob[p] = factor;
						for (var remainder=total-factor*3, p= 1; remainder; ++p, --remainder)
							_self.stochastic_model.prob[p]++;

						_self.stochastic_model.prob[4]=0;
						break;

					case _STOCHASTIC_ACTIONS_MODEL.OPPOSITE_ACTION:
						_self.stochastic_model.prob[1] =
						_self.stochastic_model.prob[2] =
						_self.stochastic_model.prob[4] = 0;
						_self.stochastic_model.prob[3] = 1000-v;
						break;
					case _STOCHASTIC_ACTIONS_MODEL.USER_DEFINED:
						for (var i=_self.stchastic_user_model.length;i--;)
							_self.stchastic_user_model[i] = (_self.stochastic_model.prob[i]/10).toFixed(1);
				}
			}

			this.checkStochasticModel = function(){
				var add = 0;
				for (var i = 5; i--;)
					add += _self.stochastic_model.prob[i];

				return add === 1000;
			}

			$scope.$watch('enc.stochastic_model.prob[0]', this.updateStochasticModel);

			//FINAL STATE
			this.removeFinalStateCondition = function(index)
			{end_game_conditions.push(taskEnvironment.environment.final_state.remove(index))}

			this.openEndConditionsModal = function(size){
				$modal.open({
					size: size,
					templateUrl: 'end-game-cond.html',
					controller: function($scope, $modalInstance){
									$scope.end_game_cond = end_game_conditions;
									$scope.ok = function (index) {$modalInstance.close(index)};
									$scope.cancel = function () {$modalInstance.dismiss()};
									$scope.visible = function(cond){
										if (taskEnvironment.battery)
											return true;
										return cond.name.toLowerCase().indexOf("battery") < 0;
									}
								}
				})
				.result.then(
					function (index) {taskEnvironment.environment.final_state.push(end_game_conditions.remove(index))}
				);
			}
			this.setFinalLocations = function(locCond){
				$modal.open({
					size: 'lg',
					templateUrl: 'final-locations.html',
					controller:
						function($scope, $modalInstance){
							$scope.readOnly = !_self.noTrials(_self.task_env.date);
							$scope.grid = new Array(taskEnvironment.environment.rows);

							for (var r = $scope.grid.length; r--;){
								$scope.grid[r] = new Array(taskEnvironment.environment.columns);
								for (var c = $scope.grid[r].length; c--;)
									for (var l= locCond.value.length; l--;)
										if (locCond.value[l].row == r && locCond.value[l].column == c)
											$scope.grid[r][c] = "X";
							}

							$scope.ok = function(){$modalInstance.close($scope.grid)};
							$scope.close = function(){$modalInstance.dismiss()};
						}
				}).result.then(function(grid){
					locCond.value = []
					for (var r = grid.length; r--;)
						for (var c = grid[r].length; c--;)
							if (grid[r][c] == "X")
								locCond.value.push({row:r,column:c});
				});
			}

			//PROBABILITY DISTRIBUTION
			this.openProbDistModal = function(knob){
				var modalInstance = $modal.open({
					size: 'lg',
					templateUrl: 'prob-distrib.html',
					resolve: {knob: function () {return knob}},
					controller:
						function($scope, $modalInstance, knob){
							var _oldProbs=[];
							var _oldValue=0;
							$scope.readOnly = !_self.noTrials(_self.task_env.date);
							$scope.knob = knob;
							/*
							$scope.$watch('knob.prob', function(v){
							  $scope.TEST = v;
							});
							*/
							$scope.ok = function () {$modalInstance.close()};
							$scope.cancel = function () {$modalInstance.dismiss()};

							$scope.slider_options = {
								orientation:'vertical',
								range: 'min',
								start: function (event, ui) {
									_oldProbs.setTo(knob.prob);
									_oldValue = ui.value
								},
								stop: function (event, ui) {
									var index = knob.prob.length;
									var increment =  ui.value-_oldValue;

									while (index--)
										if (_oldProbs[index] != knob.prob[index])
											break;

									_updateProb(index, increment);

									$scope.$apply()//update the binding values
								}
							};

							function _updateProb(index, value){
								var len = knob.prob.length-1;
								var _amount = Math.abs(value);
								var _dec = _amount/len|0;
								var _sign = value < 0? -1 : 1;

								if (!_dec) _dec = 1;

								while (_amount){
									for (var decr, p= 0; p <= len; ++p)
										if (p != index){
											decr = _dec;

											if (_amount < _dec)
												decr = _amount;

											_amount-= decr;
											knob.prob[p] -= _sign*decr;

											if (knob.prob[p] < 0){
												_amount+= -knob.prob[p];
												knob.prob[p] = 0;
											}
										}
								}
							}

							_self.checkDistribution(knob);
						}
				});
			}

			this.checkDistribution = function(knob){
				var len = knob.range[1]-knob.range[0] + 1; if (len < 0) return;
				knob.prob.length = len;

				var add=0, i=len;
				while(i--) add += knob.prob[i];

				if (add !== 1000)
					_self.setNormalDistribution(knob);
			}

			this.setNormalDistribution = function(knob){ if (knob.range[1]==knob.range[0]) return knob.prob.length= 0;
				var len= knob.range[1]-knob.range[0] + 1;
				knob.prob.length= len;

				for (var p= 0; p < len; ++p)
					knob.prob[p] = 1/len*1000|0;
				for (var remainder=1000 - (1/len*1000|0)*len, p= 0; remainder; ++p, --remainder)
					knob.prob[p]++;
			}

			//INITIAL STATE
			this.updateDimensions = function(){
				taskEnvironment.environment.initial_state.length = taskEnvironment.environment.rows;

				for (var r = taskEnvironment.environment.initial_state.length; r--;){
					if (taskEnvironment.environment.initial_state[r])
						taskEnvironment.environment.initial_state[r].length = taskEnvironment.environment.columns;
					else
						taskEnvironment.environment.initial_state[r] = new Array(taskEnvironment.environment.columns);
				}
			}

			//MULTIAGENT
			function _addTeam(teams, nMembers){
				nMembers = nMembers || 1;

				teams.push({
					name:"Team"+_self.nTeam,
					color: colors[_self.nTeam%colors.length],
					members:nMembers //number of members
				});

				_self.nTeam++;
			}

			this.addTeam = function(nMembers){_addTeam(_self.task_env.teams, nMembers)}

			this.removeTeam = function(index){_self.task_env.teams.remove(index)}

			this.isCompetitive = function(){return taskEnvironment.prop.multiagent_type === 0}
			this.isCooperative = function(){return taskEnvironment.prop.multiagent_type === 1}
			this.isCompetitiveCooperative = function(){return taskEnvironment.prop.multiagent_type === 2}

			this.updateTeams = function(){
				if (!this.task_env.prop.multiagent)
					setSingleAgent();
				else
				if (this.isCompetitive())
					setCompetitive();
				else
				if (this.isCooperative())
					setCooperative();
				else
				if (this.isCompetitiveCooperative())
					setCompetitiveCooperative();
			}

			function setCompetitive(){
				_self.nTeam = _default.teams.comp.length;
				taskEnvironment.teams = _default.teams.comp;
				taskEnvironment.prop.multiagent_type = 0;
			}

			function setSingleAgent(){taskEnvironment.teams=_default.teams.single}

			function setCooperative(){
				_self.nTeam = _default.teams.coop.length;
				taskEnvironment.teams = _default.teams.coop;
				taskEnvironment.prop.multiagent_type = 1;
			}

			function setCompetitiveCooperative(){
				_self.nTeam = _default.teams.coopComp.length;
				taskEnvironment.teams = _default.teams.coopComp;
				taskEnvironment.prop.multiagent_type = 2;
			}

			//default teams values
			_addTeam(_default.teams.single, 1);

			if (!_default.teams.comp.length){
				this.nTeam = 0;
				_addTeam(_default.teams.comp, 1);
				_addTeam(_default.teams.comp, 1);
			}

			if (!_default.teams.coop.length){
				this.nTeam = 0;
				_addTeam(_default.teams.coop, 2);
			}

			if (!_default.teams.coopComp.length){
				this.nTeam = 0;
				_addTeam(_default.teams.coopComp, 2);
				_addTeam(_default.teams.coopComp, 2);
			}

			this.updateTeams();

			//computing end_game_conditions default values
			for (var i = taskEnv.environment.final_state.length; i--;)
				for (var j= end_game_conditions.length; j--;)
					if (taskEnv.environment.final_state[i].name == end_game_conditions[j].name){
						end_game_conditions.remove(j);
						break;
					}
	}]);

	mod.controller('InitialStateMakerController', function(){
		var _mouseDown = false;

		this.grid = [];
		this.selected = "#";
		this.holeId = 1;

		this.mouseDown = function(row, index){_mouseDown = true; this.setCell(row, index)}
		this.mouseUp = function(){_mouseDown = false}
		this.setCell = function(row, index){if (_mouseDown) row[index] = this.selected}
		this.nextHoleId = function(){this.selected = ++this.holeId}
	});

	mod.directive('properties', function(){ return {restrict:'E', templateUrl:'environments-new-props.html'} });
	mod.directive('step1', function(){ return {restrict:'E', templateUrl:'environments-new-unknown.html'} });
	mod.directive('step2', function(){ return {restrict:'E', templateUrl:'environments-new-percept.html'} });
	mod.directive('step3', function(){ return {restrict:'E', templateUrl:'environments-new-agents.html'} });
	mod.directive('step4', function(){ return {restrict:'E', templateUrl:'environments-new-actuators.html'} });
	mod.directive('step5', function(){ return {restrict:'E', templateUrl:'environments-new-environment.html'} });
	mod.directive('step6', function(){ return {restrict:'E', templateUrl:'environments-new-final.html'} });

})();