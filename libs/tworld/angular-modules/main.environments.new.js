(function(){
	var mod = angular.module('tworldEnvironmentsNew', []);

	var taskEnvironment = {
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
			stochastic_model:1
		},
		environment:{
			rows:6,
			columns:6,
			holes_size:[1,3],
			num_holes:[2,3],
			num_obstacles:[1,2],
			difficulty:[0,0],
			scores_variability: 0,
			dynamic:{
				dynamism:[6,13],
				hostility:[1,13],
				hard_bounds:true
			},
			random_initial_state:false,
			initial_state:[
				["C"," "," "," "," ","#"],
				["#"," "," ","2"," ","#"],
				[" ","#"," ","T"," ","A"],
				["1","T"," "," "," ","#"],
				["#"," "," "," ","T","#"],
				[" ","#"," ","#","3"," "]
			],
			final_state:[
				{ //default value
					name:"Time",
					value:4*60,
					result:0
				}
			]
		}
	}


	var end_game_conditions=[
		{
			name:"Filled holes",
			value:0,
			result:1
		},
		{
			name:"Filled cells",
			value:0,
			result:1
		},
		{
			name:"Score",
			value:0,
			result:1
		},
		{
			name:"Good moves",
			value:0,
			result:0
		},
		{
			name:"Bad moves",
			value:0,
			result:2
		},
		{
			name:"Battery use",
			value:0,
			result:2
		},
		{
			name:"Battery recharge",
			value:0,
			result:2
		},
		{
			name:"Battery restorations",
			value:0,
			result:2
		}
	];

	mod.controller('EnvNewController', ['$modal', function($modal){
		this.task_env = taskEnvironment;
		this.end_game_cond = end_game_conditions;
		this.step = 0;

		this.nextStep = function(){this.step++}
		this.prevStep = function(){this.step--}
		this.isStep = function(i){return this.step===i}

		this.removeFinalStateCondition = function(index)
		{end_game_conditions.push(taskEnvironment.environment.final_state.remove(index))}

		this.openModal = function(size){
			var modalInstance = $modal.open({
					size: size,
					templateUrl: 'end_game_cond.html',
					controller: function($scope, $modalInstance){
									$scope.end_game_cond = end_game_conditions;
									$scope.ok = function (index) {$modalInstance.close(index)};
									$scope.cancel = function () {$modalInstance.dismiss()};
									$scope.byBattery = function(cond){
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

		this.updateDimensions = function(){
			taskEnvironment.environment.initial_state.length = taskEnvironment.environment.rows;

			for (var r = taskEnvironment.environment.initial_state.length-1; r >= 0; --r){
				if (taskEnvironment.environment.initial_state[r])
					taskEnvironment.environment.initial_state[r].length = taskEnvironment.environment.columns;
				else
					taskEnvironment.environment.initial_state[r] = new Array(taskEnvironment.environment.columns);
			}
		}
	}]);
	
	mod.controller('InitialStateMakerController', function(){
		this.grid = taskEnvironment.environment.initial_state;
		this.selected = "#";
		this.holeId = 1;

		this.nextHoleId = function(){this.selected = ++this.holeId}
		this.setCell = function(row, index){row[index] = this.selected}
	});

	mod.directive('properties', function(){ return {restrict:'E', templateUrl:'environments-new-props.html'} });
	mod.directive('step1', function(){ return {restrict:'E', templateUrl:'environments-new-step1.html'} });
	mod.directive('step2', function(){ return {restrict:'E', templateUrl:'environments-new-step2.html'} });
	mod.directive('step3', function(){ return {restrict:'E', templateUrl:'environments-new-step3.html'} });
	mod.directive('step4', function(){ return {restrict:'E', templateUrl:'environments-new-step4.html'} });
	mod.directive('step5', function(){ return {restrict:'E', templateUrl:'environments-new-step5.html'} });
	mod.directive('step6', function(){ return {restrict:'E', templateUrl:'environments-new-step6.html'} });

})();