(function(){
	var mod = angular.module("tworldEnvironmentsNew", []);

	var taskEnvironment = {
		name:"",
		desc:"",
		prop: {
			fullyObservable: true,
			multiagent: false,
			multiagent_type: 0, //0 competitive; 1 cooperative; 2 both
			deterministic: true,
			dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
			known: false
		},
		details:{}
	}

	mod.controller("EnvNewController", function(){
		this.task_env = taskEnvironment;
	})

})();