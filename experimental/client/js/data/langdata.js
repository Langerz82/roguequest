
define(['text!../../shared/data/lang.json'], function(LangJson) {
  	var LangData = JSON.parse(LangJson);
    var Lang = Class.extend({
        init: function (lang)
        {
          this.lang = lang;
          this.data = LangData[lang];
        }
    });
    return Lang;
});
