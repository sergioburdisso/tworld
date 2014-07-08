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
					tile:0,
					obstacle:0,
					hole:0
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
			}
		}
	}

	mod.controller('EnvNewController', function(){
		this.task_env = taskEnvironment;
		this.step = 0;

		this.nextStep = function(){this.step++}
		this.prevStep = function(){this.step--}
		this.isStep = function(i){return this.step===i}
	});

	mod.directive('properties', function(){ return {restrict:'E', templateUrl:'environments-new-props.html'} });
	mod.directive('step1', function(){ return {restrict:'E', templateUrl:'environments-new-step1.html'} });
	mod.directive('step2', function(){ return {restrict:'E', templateUrl:'environments-new-step2.html'} });
	mod.directive('step3', function(){ return {restrict:'E', templateUrl:'environments-new-step3.html'} });
	mod.directive('step4', function(){ return {restrict:'E', templateUrl:'environments-new-step4.html'} });
	mod.directive('step5', function(){ return {restrict:'E', templateUrl:'environments-new-step5.html'} });
	mod.directive('step6', function(){ return {restrict:'E', templateUrl:'environments-new-step6.html'} });

})();