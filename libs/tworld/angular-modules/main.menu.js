(function(){
	var mod = angular.module("tworldMainMenu", []);

	mod.controller("MainMenuController", function(){
		var _self = this;

		this.menu = -1;
		this.overStart = false;

		this.leave = function(){this.menu = -1}
		this.setActive = function(i){this.menu = i}
		this.isActive = function(i){return this.menu === i}

		this.startEnter = function(){this.overStart = true}
		this.startLeave = function(){this.overStart = false}
		this.isOnStart = function(){return this.overStart}

		this.startTWorld = startTWorld;
	})

})();