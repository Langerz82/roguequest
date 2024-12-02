var img = document.createElement('img');
img.src = "img/common/ts-1-1.png"
img.style.display = "none"
var img = document.createElement('img');
img.src = "img/common/ts-1-2.png"
img.style.display = "none"


var cachefiles = [
  {name: "http://45.63.90.163/maps/map0.zip"},
  {name: "http://45.63.90.163/maps/map1.zip"}
  //{name: "js/js.zip"}
];



var saveFile = function (zip, filename) {
  try {
    return zip.file(filename).async('string').then(function (fileData) {
      return new File([fileData], "./js/"+filename);
    })
  }
  catch (err) {
    console.error(JSON.stringify(err));
  }
};

/*
var count = 0;
document.addEventListener("DOMContentLoaded", function(event) {
var zipfile = "js.zip";

JSZipUtils.getBinaryContent(zipfile, function(err, data) {
    if(err) {
        throw err; // or handle err
    }

    JSZip.loadAsync(data).then(function(zip) {
      for (var file in zip.files) {
        //saveFile(zip, file);
        if (file.indexOf(".js") >= 0) {
          zip.file(file).async("string").then(function(data) {});
          count++;
        }
        log.info("count="+count);
        if (count == 1) {
          var scriptEle = document.createElement("script");
          scriptEle.setAttribute("type", "text/javascript");
          scriptEle.setAttribute("src", "javascripts/require.js");
          document.body.appendChild(scriptEle);
        }
        if (count < 126) {
          var scriptEle = document.createElement("script");
          scriptEle.setAttribute("src", file);
          document.body.appendChild(scriptEle);
        }
        else {
          var scriptEle = document.createElement("script");
          scriptEle.setAttribute("type", "text/javascript");
          scriptEle.setAttribute("src", "javascripts/require.js");
          scriptEle.setAttribute("data-main","js/home");
          document.body.appendChild(scriptEle);
        }
      }
    });
});

});
*/

document.addEventListener("DOMContentLoaded", function(event) {
  var applyTextStroke = function (className, color, width)
  {
    var n = Math.ceil(2*Math.PI*width); /* number of shadows */
    var str = '';
    for(var i = 0; i < n; ++i) /* append shadows in n evenly distributed directions */
    {
      var theta = 2*Math.PI*i/n;
      str += (width*Math.cos(theta))+"px "+(width*Math.sin(theta))+"px 0 "+color+(i==n-1?"":",");
    }
    var arr = document.getElementsByClassName(className);
    for (var dom of arr)
    {
      dom.style.textShadow = str;
    }
  };
  applyTextStroke("frame-stroke", "#333", 3);
  applyTextStroke("frame-stroke1", "#333", 2);
  applyTextStroke("frame-stroke", "#333", 3);
  applyTextStroke("frame-new-button", "#333", 3);
  applyTextStroke("newFieldName", "#333", 2);
  applyTextStroke("frame-heading", "#333", 3);
  applyTextStroke("frame-content", "#333", 2);
  applyTextStroke("frame-panel", "#333", 2);

  //<script src="js/compress.js" data-main="home"></script>
  /*var scriptEle = document.createElement("script");
  scriptEle.setAttribute("type", "text/javascript");
  scriptEle.setAttribute("src", "http://45.63.90.163:8080/js/compress.js");
  scriptEle.setAttribute("data-main","home");
  document.body.appendChild(scriptEle);*/
});

/*
for (var zipfile of cachefiles)
{
  //console.info("file="+$file.name);
  JSZipUtils.getBinaryContent(zipfile.name, function(err, data) {
      if(err) {
          throw err; // or handle err
      }

      JSZip.loadAsync(data).then(function(zip) {
        for (var file in zip.files) {
          try {
            zip.file(file).async("string").then(function(data) {
            });
          }
          catch (err) {
            console.error(JSON.stringify(err));
          }
        }
      });

      //console.warn(JSON.stringify(data))
  });
}
*/
