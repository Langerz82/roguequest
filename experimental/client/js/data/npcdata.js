/* global Types */
define(['text!../../shared/data/npcs.json', 'text!../../shared/data/npc_english.json'], function(NPCsJson, NPCSpeakJson) {

	var NpcData = {};
	NpcData.npcSpeak = JSON.parse(NPCSpeakJson);

	NpcData.Properties = {};
	NpcData.Kinds = JSON.parse(NPCsJson);
	NpcData.Kinds.forEach( function( value, key ) {
		value.title = value.name || value.uid;
		NpcData.Properties[value.uid] = value;
	});

	NpcData.isNpc = function(kind){
	    return NpcData.Kinds[kind] ? true : false;
	};
    return NpcData;
});
