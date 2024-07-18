define(['lib/class', 'lib/underscore.min', 'lib/stacktrace', 'util', '../shared/js/itemtypes', '../shared/js/gametypes', 'main', 'lib/jquery'],
  function(Class, _, st, util, ItemTypes, Types, Main, $) {
    require.config({
        baseUrl: "js",
        waitSeconds: 20,
        paths: {
            home: 'home',
            jquery: 'lib/jquery',
            class: 'lib/class',
            itemtypes: '../shared/js/itemtypes',
            gametypes: '../shared/js/gametypes'
        },
        shim: {
            "jquery": {
                exports: ['jQuery', '$', 'jquery']
            },
            "class": {
                exports: ['Class']
            },
            "itemtypes": {
                exports: 'ItemTypes'
            },
            "gametypes": {
                exports: 'Types'
            },
            "home": {
                deps: ["jquery"]
            }
        }

    });

    //var Main = require(['main']);
    return Main;
});
