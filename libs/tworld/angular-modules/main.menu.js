(function(){
	var mod = angular.module("tworldMainMenu", []);

	mod.controller("MainMenuController", ["$modal", function($modal){
		var _self = this;

		this.menu = -1;
		this.overStart = false;

		this.leave = function(){this.menu = -1}
		this.setActive = function(i){this.menu = i}
		this.isActive = function(i){return this.menu === i}

		this.startTWorld = function(){
			var modalInstance = $modal.open({
						size: 'lg',//size,
						templateUrl: 'items-list-modal.html',
						controller: itemsListController,
						resolve:{
							items:function(){return taskEnvironments},
							agentProgramsFlag:function(){return false}
						}
					});

				modalInstance.result.then(
					function (id) {
						$modal.open({
							size: 'lg',//size,
							templateUrl: 'run-modal.html',
							controller: runModalController,
							resolve:{
								taskEnv: function(){return getEnvironmentByDate(id)}, 
								agentProgs: function(){return []}
							}
						});
					}
				);
		}
	}])

})();