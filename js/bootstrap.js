/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'dollar', 
  'lib/io',
  'lib/io/jsonResultAdapter'             // pass 'd' as result, call error handlers for 200 responses with { success: false }
  // 'lib/io/deviceInfoAdapter',          // adds device/app info to each lattice request
  // 'lib/io/needsTokenAdapter'           // gives us config.csrf_token, config.username
], function(
  $, 
  io,
  jsonResultAdapter,
  dataAdapters// ,
  //   deviceInfoAdapter
  // needsTokenAdapter
){

  function extend(thing1, thing2){
    thing1 = thing1 || {}; 
    for(var key in thing2 || {}){
      thing1[key] = thing2[key];
    }
    return thing1;
  }

  var slice = Array.prototype.slice; 
  
  if(!(config && config.packages)){
    throw "No config global";
  }

  io.installAdapter(); // replace $.ajax with our own registry-adapted dispatcher
  io.ajax.after(function(args, resp, next){
    // application-wide response pre-processing
    if(jsonResultAdapter.matcher(args[0])) {
      // console.log("Applying jsonResultAdapter");
      jsonResultAdapter(args, resp, next);
    } else {
      next(args, resp);
    }
  });

  // Set pixel density on config object for reference in other modules.
  config.devicePixelRatio = window.devicePixelRatio || 1;

  function queryToObject(queryStr) {
    var pairs, nameValue, params = {};
    if(queryStr){
      pairs = queryStr.split('&');
      for(var i=0; i<pairs.length; i++) {
        nameValue = pairs[i].split('=');
        params[ nameValue[0] ] = nameValue[1];
      }
    }
    return params;
  }
  
  extend(
    config, queryToObject(location.search.substring(1))
  );
  console.log("Bootstrap done, returning config:", config);
  return config;
});
