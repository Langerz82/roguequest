
define(['text!../../shared/data/appearance.json'], function(AppearancesJson) {
	var Appearances = [];
	var appearanceParse = JSON.parse(AppearancesJson);
	/*Appearances[0] = {
	  name: "blank",
	  type: "",
	  sprite: "",
	  buy: 0
	};*/

	$.each( appearanceParse, function( key, val ) {
		Appearances[key] = {
			name: val.name,
			type: val.type,
			sprite: val.sprite,
			buy: val.buy
		};
	});
    return Appearances;
});
