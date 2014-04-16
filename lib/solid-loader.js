var loadQueue = new Array();
function importScript(file){
	loadQueue.push(file);
}

function loadAllSync(){
	if (loadQueue.length > 0){
		var head=document.getElementsByTagName("head")[0];
		var script=document.createElement('script');
		script.src=loadQueue.shift();
		script.type='text/javascript';
		//real browsers
		script.onload=loadAllSync;
		//Internet explorer
		script.onreadystatechange = function() {
			if (this.readyState == 'complete') {
				loadAllSync();
			}
		}
		head.appendChild(script);
	}
}

//--------------------------------------------------
importScript("./lib/jquery/jquery-1.7.2.min.js");
importScript("./lib/jquery/jquery.mousewheel.js");

importScript("./lib/sound/buzz.min.js");

importScript("./copperlichtdata/copperlicht.js");

importScript("./lib/tileworld/solid-global.js");
importScript("./lib/tileworld/solid-auxiliary.js");
importScript("./lib/tileworld/solid-general-settings.js");
importScript("./lib/tileworld/solid-core.js");
importScript("./lib/tileworld/solid-environment.js");
importScript("./lib/tileworld/solid-graphic.js");
importScript("./lib/tileworld/solid-graphic-rob.js");

loadAllSync();
