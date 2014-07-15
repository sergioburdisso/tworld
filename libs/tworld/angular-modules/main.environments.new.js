/*
* main.environments.new.js - 
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
	var mod = angular.module('tworldEnvironmentsNew', []);

	var colors = []; for (color in _COLORS) colors.push(_COLORS[color]);
	var taskEnvironment;

	mod.controller('EnvNewController', ['$modal','$location', function($modal, $location){
		var _next = false;
		var _self = this;
		this.isTWorldRunning = isTWorldRunning;
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
		this.task_env = taskEnvironment = {
			trial: {//Each trial is a self-contained simulation with a certain duration (in ticks of the clock)
				test:false
			},
			name:'',
			desc:'',
			battery: false,
			prop: {
				fullyObservable: true,
				multiagent: false,
				multiagent_type: 0, //0 competitive; 1 cooperative; 2 both
				deterministic: true,
				dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
				known: true
			},
			agents:{
				percept:{
					sync:true,
					partialGrid: true,
					radius: 3,
					noise: false,
					noise_cfg:{
						tile:0.3,
						obstacle:0.3,
						hole:0.3
					}
				},
				determinism:80,
				stochastic_model: _STOCHASTIC_ACTIONS_MODEL.ANOTHER_ACTION
			},
			environment:{
				rows:6,
				columns:6,
				holes_size:{range:[1,3], prob:[]},
				num_holes:{range:[2,3], prob:[]},
				num_obstacles:{range:[1,2], prob:[]},
				difficulty:{range:[0,0], prob:[]},
				scores_variability: 0,
				dynamic:{
					dynamism:{range:[6,13], prob:[]},
					hostility:{range:[1,13], prob:[]},
					hard_bounds:true,
				},
				random_initial_state:false,
				initial_state:[
					[" "," "," "," "," ","#"],
					["#"," "," ","2"," ","#"],
					[" ","#"," ","T"," ","A"],
					["1","T"," "," "," ","#"],
					["#"," "," "," ","T","#"],
					[" ","#"," ","#","3"," "]
				],
				final_state:[{name:_ENDGAME.TIME.NAME, value:5*60, result:_GAME_RESULT.NEUTRAL}] //default value
			},
			teams:[],
			final_tweaks:{
				battery:{
					level:1000,
					good_move:20,
					bad_move:5,
					sliding:10
				},
				multiplier:{
					enabled:false,
					timeout:6
				},
				score:{
					cell: true
				},
				shapes:false
			}
		}

		this.nextStep = function(){this.step++; _next= true}
		this.prevStep = function(){this.step--; _next= false}
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
			taskEnvironments.push(taskEnvironment);
			saveEnvironments();
			$location.url('/')
		}

		this.testEnvironment = function(){
			this.validate();
			taskEnvironment.trial.test = true;
			saveKnobs(taskEnvironment);

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

		//FINAL STATE
		this.removeFinalStateCondition = function(index)
		{end_game_conditions.push(taskEnvironment.environment.final_state.remove(index))}

		this.openEndConditionsModal = function(size){
			var modalInstance = $modal.open({
					size: size,
					templateUrl: 'end_game_cond.html',
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
				templateUrl: 'prob_distrib.html',
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
		this.addTeam = function(nMembers){
			nMembers = nMembers || 1;

			taskEnvironment.teams.push({
				name:"Team"+this.nTeam,
				color: colors[this.nTeam%colors.length],
				members:nMembers
			});

			this.nTeam++;
		}

		this.removeTeam = function(index){taskEnvironment.teams.remove(index)}

		this.isCompetitive = function(){return taskEnvironment.prop.multiagent_type === 0}
		this.isCooperative = function(){return taskEnvironment.prop.multiagent_type === 1}
		this.isCompetitiveCooperative = function(){return taskEnvironment.prop.multiagent_type === 2}

		this.updateTeams = function(){
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
			taskEnvironment.teams.length = _self.nTeam = 0;
			_self.addTeam(1);
			_self.addTeam(1);

			taskEnvironment.prop.multiagent_type = 0;
		}

		function setCooperative(){
			taskEnvironment.teams.length = _self.nTeam = 0;
			_self.addTeam(2);

			taskEnvironment.prop.multiagent_type = 1;
		}

		function setCompetitiveCooperative(){
			taskEnvironment.teams.length = _self.nTeam = 0;
			_self.addTeam(2);
			_self.addTeam(2);

			taskEnvironment.prop.multiagent_type = 2;
		}

		setCompetitive();
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
