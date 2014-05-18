var loadQueue = new Array();
function importScript(file, condition){
	loadQueue.push(!condition? file : [file, condition]);
}

function loadAllSync(){
	if (loadQueue.length > 0){
		var head=document.getElementsByTagName("head")[0];
		var script, file;

		file= loadQueue.shift(); // FIFO

		//if this file have conditions under which it has to be loaded
		// and they are satisfied, load the file... 
		if (!(file instanceof Array) || eval(file[1])){
			script= document.createElement('script');
			script.src= (file instanceof Array)? file[0] : file;
			script.type='text/javascript';

			if (console){
				console.clear();
				console.log("Loading modules... [" + script.src + "]");
			}

			//real browsers
			script.onload= loadAllSync;

			//Internet explorer XD
			script.onreadystatechange = function() {
				if (this.readyState == 'complete'){
						loadAllSync();
				}
			}
			head.appendChild(script);
		}else
		//...otherwise skip this file, and try loading the next one
			loadAllSync();
	}else{
		console.clear();
	}
}

//--------------------------------------------------
importScript("./lib/jquery/jquery-1.7.2.min.js");
importScript("./lib/tileworld/solid-auxiliary.js");
importScript("./lib/jquery/jquery.mousewheel.js");

importScript("./lib/tileworld/solid-global.js");
importScript("./lib/tileworld/solid-general-settings.js");

importScript(
	"./lib/util/xml2json.min.js",
	/*provided that the following conditions are satisfied*/
	"_CONTROLLED_BY_AI && _SOCKET_PROGRAM_AGENT && _SOCKET_OUTPUT_FORMAT == _PERCEPT_FORMAT.XML"
);
importScript(
	"./lib/util/sprintf.min.js",
	/*provided that the following conditions are satisfied*/
	"_CONTROLLED_BY_AI && _SOCKET_PROGRAM_AGENT && _SOCKET_OUTPUT_FORMAT == _PERCEPT_FORMAT.PROLOG"
);

importScript(
	"./lib/sound/buzz.min.js",
	/*provided that the following condition is satisfied*/
	"_AUDIO_ENABLE"
);

importScript("./copperlichtdata/copperlicht.js");

importScript("./lib/tileworld/solid-core.js");
importScript("./lib/tileworld/solid-environment.js");
importScript("./lib/tileworld/solid-graphic.js");
importScript("./lib/tileworld/solid-graphic-rob.js");

loadAllSync();
