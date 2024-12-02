/* global Types */
define(['text!../../shared/data/quests.json'], function(QuestsJson) {
	var padding = function (val, size) {
	    var s = val+"";
	    while (s.length < size) s = "0" + s;
	    return s;
	}

	var QuestData = {};
	var data = JSON.parse(QuestsJson);

  var i = 0;
  _.each(data, function( quest, key ) {
    var id = padding(quest.type,2) + padding(quest.npcId,4) + padding(i,3);
  	QuestData[id] = quest;
  	QuestData[id].id = id;
    QuestData[id].objectId = quest.objectId || 0;
    QuestData[id].objectCount = quest.objectCount || 0;
    i++;
  });

  return QuestData;
});
