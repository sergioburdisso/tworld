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

		this.taskEnvironments = taskEnvironments;
		this.orderCond = "-date";
		this.allProps = true;
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

		this.open = function(){$location.url('/environments/view/'+_selected)}

		this.remove = function(){
			for (var t=taskEnvironments.length; t--;)
				if (taskEnvironments[t].date == _selected)
					taskEnvironments.remove(t);
			saveEnvironments();
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

	}]);

	mod.controller('EnvNewController', ['$modal', '$location', 'taskEnv',
		function($modal, $location, taskEnv){
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

			this.nTeam = 0;
			this.teamColors = colors;
			this.step = 0;
			this.end_game_cond = end_game_conditions = [
				{name:_ENDGAME.FILLED_HOLES.NAME		, value:0, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.FILLED_CELLS.NAME		, value:0, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.SCORE.NAME				, value:0, result:_GAME_RESULT.WON		},
				{name:_ENDGAME.GOOD_MOVES.NAME			, value:0, result:_GAME_RESULT.NEUTRAL	},
				{name:_ENDGAME.BAD_MOVES.NAME			, value:0, result:_GAME_RESULT.LOST		},
				{name:_ENDGAME.BATTERY_USED.NAME		, value:0, result:_GAME_RESULT.LOST		},
				{name:_ENDGAME.BATTERY_RECHARGE.NAME	, value:0, result:_GAME_RESULT.LOST		},
				{name:_ENDGAME.BATTERY_RESTORE.NAME		, value:0, result:_GAME_RESULT.LOST		}
				/*{name:_ENDGAME.TIME.NAME, value:0, result:_GAME_RESULT.NEUTRAL} <-not here 'cause it's the default value*/ 
			];
			this.task_env = taskEnvironment = taskEnv;

			this.nextStep = function(){
				this.step++; _next= true;
				$('html, body').animate({scrollTop: $("#top").offset().top}, 0);
			}
			this.prevStep = function(){
				this.step--; _next= false;
				$('html, body').animate({scrollTop: $("#top").offset().top}, 0);
			}
			this.isStep = function(i){return this.step===i}
			this.isLastStep = function(){return this.step===6}
			this.correctStep = function(){if (_next) this.step++; else this.step--}

			this.isDeterministic = function(){return taskEnvironment.prop.deterministic}
			this.isDynamic = function(){return taskEnvironment.prop.dynamic === 2}
			this.isSemidynamic = function(){return taskEnvironment.prop.dynamic === 1}
			this.isRange = function(range){return range[0]!=range[1]}

			this.finish = function(){
				this.validate();

				taskEnvironment.trial.test = false;

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

			//Text
			this.getTextVisibilityRadius = function(){
				var radius = this.task_env.agents.percept.radius;
				if (!radius)
					return "Unobservable environment";
				else
					return "Radius of " + radius + " cell" + (radius > 1? "s" : "");
			}

			//FINAL STATE
			this.removeFinalStateCondition = function(index)
			{end_game_conditions.push(taskEnvironment.environment.final_state.remove(index))}

			this.openEndConditionsModal = function(size){
				var modalInstance = $modal.open({
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
					});

				modalInstance.result
					.then(
						function (index) {taskEnvironment.environment.final_state.push(end_game_conditions.remove(index))}
					);
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

							$scope.knob = knob;
							/*
							$scope.$watch('knob.prob', function(v){
							  $scope.TEST = v;
							});
							*/
							$scope.ok = function (index) {$modalInstance.close()};
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

				for (var r = taskEnvironment.environment.initial_state.length-1; r >= 0; --r){
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

			this.removeTeam = function(index){teams.remove(index)}

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
				taskEnvironment.teams = _default.teams.comp;
				taskEnvironment.prop.multiagent_type = 0;
			}

			function setSingleAgent(){taskEnvironment.teams=_default.teams.single}

			function setCooperative(){
				taskEnvironment.teams = _default.teams.coop;
				taskEnvironment.prop.multiagent_type = 1;
			}

			function setCompetitiveCooperative(){
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
	}]);

	mod.controller('InitialStateMakerController', function(){
		var _mouseDown = false;

		this.grid = taskEnvironment.environment.initial_state;
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