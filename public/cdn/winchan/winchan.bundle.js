(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;WinChan = (function() {
  var RELAY_FRAME_NAME = "__winchan_relay_frame";
  var CLOSE_CMD = "die";

  // a portable addListener implementation
  function addListener(w, event, cb) {
    if(w.attachEvent) w.attachEvent('on' + event, cb);
    else if (w.addEventListener) w.addEventListener(event, cb, false);
  }

  // a portable removeListener implementation
  function removeListener(w, event, cb) {
    if(w.detachEvent) w.detachEvent('on' + event, cb);
    else if (w.removeEventListener) w.removeEventListener(event, cb, false);
  }


  // checking for IE8 or above
  function isInternetExplorer() {
    var rv = -1; // Return value assumes failure.
    var ua = navigator.userAgent;
    if (navigator.appName === 'Microsoft Internet Explorer') {
      var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat(RegExp.$1);
    }
    // IE > 11
    else if (ua.indexOf("Trident") > -1) {
      var re = new RegExp("rv:([0-9]{2,2}[\.0-9]{0,})");
      if (re.exec(ua) !== null) {
        rv = parseFloat(RegExp.$1);
      }
    }

    return rv >= 8;
  }

  // checking Mobile Firefox (Fennec)
  function isFennec() {
    try {
      // We must check for both XUL and Java versions of Fennec.  Both have
      // distinct UA strings.
      var userAgent = navigator.userAgent;
      return (userAgent.indexOf('Fennec/') != -1) ||  // XUL
             (userAgent.indexOf('Firefox/') != -1 && userAgent.indexOf('Android') != -1);   // Java
    } catch(e) {}
    return false;
  }

  // feature checking to see if this platform is supported at all
  function isSupported() {
    return (window.JSON && window.JSON.stringify &&
            window.JSON.parse && window.postMessage);
  }

  // given a URL, extract the origin
  function extractOrigin(url) {
    if (!/^https?:\/\//.test(url)) url = window.location.href;
    var a = document.createElement('a');
    a.href = url;
    return a.protocol + "//" + a.host;
  }

  // find the relay iframe in the opener
  function findRelay() {
    var loc = window.location;
    var frames = window.opener.frames;
    for (var i = frames.length - 1; i >= 0; i--) {
      try {
        if (frames[i].location.protocol === window.location.protocol &&
            frames[i].location.host === window.location.host &&
            frames[i].name === RELAY_FRAME_NAME)
        {
          return frames[i];
        }
      } catch(e) { }
    }
    return;
  }

  var isIE = isInternetExplorer();

  if (isSupported()) {
    /*  General flow:
     *                  0. user clicks
     *  (IE SPECIFIC)   1. caller adds relay iframe (served from trusted domain) to DOM
     *                  2. caller opens window (with content from trusted domain)
     *                  3. window on opening adds a listener to 'message'
     *  (IE SPECIFIC)   4. window on opening finds iframe
     *                  5. window checks if iframe is "loaded" - has a 'doPost' function yet
     *  (IE SPECIFIC5)  5a. if iframe.doPost exists, window uses it to send ready event to caller
     *  (IE SPECIFIC5)  5b. if iframe.doPost doesn't exist, window waits for frame ready
     *  (IE SPECIFIC5)  5bi. once ready, window calls iframe.doPost to send ready event
     *                  6. caller upon reciept of 'ready', sends args
     */
    return {
      open: function(opts, cb) {
        if (!cb) throw "missing required callback argument";

        // test required options
        var err;
        if (!opts.url) err = "missing required 'url' parameter";
        if (!opts.relay_url) err = "missing required 'relay_url' parameter";
        if (err) setTimeout(function() { cb(err); }, 0);

        // supply default options
        if (!opts.window_name) opts.window_name = null;
        if (!opts.window_features || isFennec()) opts.window_features = undefined;

        // opts.params may be undefined

        var iframe;

        // sanity check, are url and relay_url the same origin?
        var origin = extractOrigin(opts.url);
        if (origin !== extractOrigin(opts.relay_url)) {
          return setTimeout(function() {
            cb('invalid arguments: origin of url and relay_url must match');
          }, 0);
        }

        var messageTarget;

        if (isIE) {
          // first we need to add a "relay" iframe to the document that's served
          // from the target domain.  We can postmessage into a iframe, but not a
          // window
          iframe = document.createElement("iframe");
          // iframe.setAttribute('name', framename);
          iframe.setAttribute('src', opts.relay_url);
          iframe.style.display = "none";
          iframe.setAttribute('name', RELAY_FRAME_NAME);
          document.body.appendChild(iframe);
          messageTarget = iframe.contentWindow;
        }

        var w = window.open(opts.url, opts.window_name, opts.window_features);

        if (!messageTarget) messageTarget = w;

        // lets listen in case the window blows up before telling us
        var closeInterval = setInterval(function() {
          if (w && w.closed) {
            cleanup();
            if (cb) {
              cb('unknown closed window');
              cb = null;
            }
          }
        }, 500);

        var req = JSON.stringify({a: 'request', d: opts.params});

        // cleanup on unload
        function cleanup() {
          if (iframe) document.body.removeChild(iframe);
          iframe = undefined;
          if (closeInterval) closeInterval = clearInterval(closeInterval);
          removeListener(window, 'message', onMessage);
          removeListener(window, 'unload', cleanup);
          if (w) {
            try {
              w.close();
            } catch (securityViolation) {
              // This happens in Opera 12 sometimes
              // see https://github.com/mozilla/browserid/issues/1844
              messageTarget.postMessage(CLOSE_CMD, origin);
            }
          }
          w = messageTarget = undefined;
        }

        addListener(window, 'unload', cleanup);

        function onMessage(e) {
          if (e.origin !== origin) { return; }
          try {
            var d = JSON.parse(e.data);
            if (d.a === 'ready') messageTarget.postMessage(req, origin);
            else if (d.a === 'error') {
              cleanup();
              if (cb) {
                cb(d.d);
                cb = null;
              }
            } else if (d.a === 'response') {
              cleanup();
              if (cb) {
                cb(null, d.d);
                cb = null;
              }
            }
          } catch(err) { }
        }

        addListener(window, 'message', onMessage);

        return {
          close: cleanup,
          focus: function() {
            if (w) {
              try {
                w.focus();
              } catch (e) {
                // IE7 blows up here, do nothing
              }
            }
          }
        };
      },
      onOpen: function(cb) {
        var o = "*";
        var msgTarget = isIE ? findRelay() : window.opener;
        if (!msgTarget) throw "can't find relay frame";
        function doPost(msg) {
          msg = JSON.stringify(msg);
          if (isIE) msgTarget.doPost(msg, o);
          else msgTarget.postMessage(msg, o);
        }

        function onMessage(e) {
          // only one message gets through, but let's make sure it's actually
          // the message we're looking for (other code may be using
          // postmessage) - we do this by ensuring the payload can
          // be parsed, and it's got an 'a' (action) value of 'request'.
          var d;
          try {
            d = JSON.parse(e.data);
          } catch(err) { }
          if (!d || d.a !== 'request') return;
          removeListener(window, 'message', onMessage);
          o = e.origin;
          if (cb) {
            // this setTimeout is critically important for IE8 -
            // in ie8 sometimes addListener for 'message' can synchronously
            // cause your callback to be invoked.  awesome.
            setTimeout(function() {
              cb(o, d.d, function(r) {
                cb = undefined;
                doPost({a: 'response', d: r});
              });
            }, 0);
          }
        }

        function onDie(e) {
          if (e.data === CLOSE_CMD) {
            try { window.close(); } catch (o_O) {}
          }
        }
        addListener(isIE ? msgTarget : window, 'message', onMessage);
        addListener(isIE ? msgTarget : window, 'message', onDie);

        // we cannot post to our parent that we're ready before the iframe
        // is loaded. (IE specific possible failure)
        try {
          doPost({a: "ready"});
        } catch(e) {
          // this code should never be exectued outside IE
          addListener(msgTarget, 'load', function(e) {
            doPost({a: "ready"});
          });
        }

        // if window is unloaded and the client hasn't called cb, it's an error
        var onUnload = function() {
          try {
            // IE8 doesn't like this...
            removeListener(isIE ? msgTarget : window, 'message', onDie);
          } catch (ohWell) { }
          if (cb) doPost({ a: 'error', d: 'client closed window' });
          cb = undefined;
          // explicitly close the window, in case the client is trying to reload or nav
          try { window.close(); } catch (e) { }
        };
        addListener(window, 'unload', onUnload);
        return {
          detach: function() {
            removeListener(window, 'unload', onUnload);
          }
        };
      }
    };
  } else {
    return {
      open: function(url, winopts, arg, cb) {
        setTimeout(function() { cb("unsupported browser"); }, 0);
      },
      onOpen: function(cb) {
        setTimeout(function() { cb("unsupported browser"); }, 0);
      }
    };
  }
})();

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvY2RuL3dpbmNoYW4vd2luY2hhbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjtXaW5DaGFuID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgUkVMQVlfRlJBTUVfTkFNRSA9IFwiX193aW5jaGFuX3JlbGF5X2ZyYW1lXCI7XG4gIHZhciBDTE9TRV9DTUQgPSBcImRpZVwiO1xuXG4gIC8vIGEgcG9ydGFibGUgYWRkTGlzdGVuZXIgaW1wbGVtZW50YXRpb25cbiAgZnVuY3Rpb24gYWRkTGlzdGVuZXIodywgZXZlbnQsIGNiKSB7XG4gICAgaWYody5hdHRhY2hFdmVudCkgdy5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGNiKTtcbiAgICBlbHNlIGlmICh3LmFkZEV2ZW50TGlzdGVuZXIpIHcuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2IsIGZhbHNlKTtcbiAgfVxuXG4gIC8vIGEgcG9ydGFibGUgcmVtb3ZlTGlzdGVuZXIgaW1wbGVtZW50YXRpb25cbiAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodywgZXZlbnQsIGNiKSB7XG4gICAgaWYody5kZXRhY2hFdmVudCkgdy5kZXRhY2hFdmVudCgnb24nICsgZXZlbnQsIGNiKTtcbiAgICBlbHNlIGlmICh3LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2IsIGZhbHNlKTtcbiAgfVxuXG5cbiAgLy8gY2hlY2tpbmcgZm9yIElFOCBvciBhYm92ZVxuICBmdW5jdGlvbiBpc0ludGVybmV0RXhwbG9yZXIoKSB7XG4gICAgdmFyIHJ2ID0gLTE7IC8vIFJldHVybiB2YWx1ZSBhc3N1bWVzIGZhaWx1cmUuXG4gICAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICBpZiAobmF2aWdhdG9yLmFwcE5hbWUgPT09ICdNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXInKSB7XG4gICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiTVNJRSAoWzAtOV17MSx9W1xcLjAtOV17MCx9KVwiKTtcbiAgICAgIGlmIChyZS5leGVjKHVhKSAhPSBudWxsKVxuICAgICAgICBydiA9IHBhcnNlRmxvYXQoUmVnRXhwLiQxKTtcbiAgICB9XG4gICAgLy8gSUUgPiAxMVxuICAgIGVsc2UgaWYgKHVhLmluZGV4T2YoXCJUcmlkZW50XCIpID4gLTEpIHtcbiAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCJydjooWzAtOV17MiwyfVtcXC4wLTldezAsfSlcIik7XG4gICAgICBpZiAocmUuZXhlYyh1YSkgIT09IG51bGwpIHtcbiAgICAgICAgcnYgPSBwYXJzZUZsb2F0KFJlZ0V4cC4kMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJ2ID49IDg7XG4gIH1cblxuICAvLyBjaGVja2luZyBNb2JpbGUgRmlyZWZveCAoRmVubmVjKVxuICBmdW5jdGlvbiBpc0Zlbm5lYygpIHtcbiAgICB0cnkge1xuICAgICAgLy8gV2UgbXVzdCBjaGVjayBmb3IgYm90aCBYVUwgYW5kIEphdmEgdmVyc2lvbnMgb2YgRmVubmVjLiAgQm90aCBoYXZlXG4gICAgICAvLyBkaXN0aW5jdCBVQSBzdHJpbmdzLlxuICAgICAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgICByZXR1cm4gKHVzZXJBZ2VudC5pbmRleE9mKCdGZW5uZWMvJykgIT0gLTEpIHx8ICAvLyBYVUxcbiAgICAgICAgICAgICAodXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gvJykgIT0gLTEgJiYgdXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPSAtMSk7ICAgLy8gSmF2YVxuICAgIH0gY2F0Y2goZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBmZWF0dXJlIGNoZWNraW5nIHRvIHNlZSBpZiB0aGlzIHBsYXRmb3JtIGlzIHN1cHBvcnRlZCBhdCBhbGxcbiAgZnVuY3Rpb24gaXNTdXBwb3J0ZWQoKSB7XG4gICAgcmV0dXJuICh3aW5kb3cuSlNPTiAmJiB3aW5kb3cuSlNPTi5zdHJpbmdpZnkgJiZcbiAgICAgICAgICAgIHdpbmRvdy5KU09OLnBhcnNlICYmIHdpbmRvdy5wb3N0TWVzc2FnZSk7XG4gIH1cblxuICAvLyBnaXZlbiBhIFVSTCwgZXh0cmFjdCB0aGUgb3JpZ2luXG4gIGZ1bmN0aW9uIGV4dHJhY3RPcmlnaW4odXJsKSB7XG4gICAgaWYgKCEvXmh0dHBzPzpcXC9cXC8vLnRlc3QodXJsKSkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYS5ocmVmID0gdXJsO1xuICAgIHJldHVybiBhLnByb3RvY29sICsgXCIvL1wiICsgYS5ob3N0O1xuICB9XG5cbiAgLy8gZmluZCB0aGUgcmVsYXkgaWZyYW1lIGluIHRoZSBvcGVuZXJcbiAgZnVuY3Rpb24gZmluZFJlbGF5KCkge1xuICAgIHZhciBsb2MgPSB3aW5kb3cubG9jYXRpb247XG4gICAgdmFyIGZyYW1lcyA9IHdpbmRvdy5vcGVuZXIuZnJhbWVzO1xuICAgIGZvciAodmFyIGkgPSBmcmFtZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChmcmFtZXNbaV0ubG9jYXRpb24ucHJvdG9jb2wgPT09IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCAmJlxuICAgICAgICAgICAgZnJhbWVzW2ldLmxvY2F0aW9uLmhvc3QgPT09IHdpbmRvdy5sb2NhdGlvbi5ob3N0ICYmXG4gICAgICAgICAgICBmcmFtZXNbaV0ubmFtZSA9PT0gUkVMQVlfRlJBTUVfTkFNRSlcbiAgICAgICAge1xuICAgICAgICAgIHJldHVybiBmcmFtZXNbaV07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSkgeyB9XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpc0lFID0gaXNJbnRlcm5ldEV4cGxvcmVyKCk7XG5cbiAgaWYgKGlzU3VwcG9ydGVkKCkpIHtcbiAgICAvKiAgR2VuZXJhbCBmbG93OlxuICAgICAqICAgICAgICAgICAgICAgICAgMC4gdXNlciBjbGlja3NcbiAgICAgKiAgKElFIFNQRUNJRklDKSAgIDEuIGNhbGxlciBhZGRzIHJlbGF5IGlmcmFtZSAoc2VydmVkIGZyb20gdHJ1c3RlZCBkb21haW4pIHRvIERPTVxuICAgICAqICAgICAgICAgICAgICAgICAgMi4gY2FsbGVyIG9wZW5zIHdpbmRvdyAod2l0aCBjb250ZW50IGZyb20gdHJ1c3RlZCBkb21haW4pXG4gICAgICogICAgICAgICAgICAgICAgICAzLiB3aW5kb3cgb24gb3BlbmluZyBhZGRzIGEgbGlzdGVuZXIgdG8gJ21lc3NhZ2UnXG4gICAgICogIChJRSBTUEVDSUZJQykgICA0LiB3aW5kb3cgb24gb3BlbmluZyBmaW5kcyBpZnJhbWVcbiAgICAgKiAgICAgICAgICAgICAgICAgIDUuIHdpbmRvdyBjaGVja3MgaWYgaWZyYW1lIGlzIFwibG9hZGVkXCIgLSBoYXMgYSAnZG9Qb3N0JyBmdW5jdGlvbiB5ZXRcbiAgICAgKiAgKElFIFNQRUNJRklDNSkgIDVhLiBpZiBpZnJhbWUuZG9Qb3N0IGV4aXN0cywgd2luZG93IHVzZXMgaXQgdG8gc2VuZCByZWFkeSBldmVudCB0byBjYWxsZXJcbiAgICAgKiAgKElFIFNQRUNJRklDNSkgIDViLiBpZiBpZnJhbWUuZG9Qb3N0IGRvZXNuJ3QgZXhpc3QsIHdpbmRvdyB3YWl0cyBmb3IgZnJhbWUgcmVhZHlcbiAgICAgKiAgKElFIFNQRUNJRklDNSkgIDViaS4gb25jZSByZWFkeSwgd2luZG93IGNhbGxzIGlmcmFtZS5kb1Bvc3QgdG8gc2VuZCByZWFkeSBldmVudFxuICAgICAqICAgICAgICAgICAgICAgICAgNi4gY2FsbGVyIHVwb24gcmVjaWVwdCBvZiAncmVhZHknLCBzZW5kcyBhcmdzXG4gICAgICovXG4gICAgcmV0dXJuIHtcbiAgICAgIG9wZW46IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XG4gICAgICAgIGlmICghY2IpIHRocm93IFwibWlzc2luZyByZXF1aXJlZCBjYWxsYmFjayBhcmd1bWVudFwiO1xuXG4gICAgICAgIC8vIHRlc3QgcmVxdWlyZWQgb3B0aW9uc1xuICAgICAgICB2YXIgZXJyO1xuICAgICAgICBpZiAoIW9wdHMudXJsKSBlcnIgPSBcIm1pc3NpbmcgcmVxdWlyZWQgJ3VybCcgcGFyYW1ldGVyXCI7XG4gICAgICAgIGlmICghb3B0cy5yZWxheV91cmwpIGVyciA9IFwibWlzc2luZyByZXF1aXJlZCAncmVsYXlfdXJsJyBwYXJhbWV0ZXJcIjtcbiAgICAgICAgaWYgKGVycikgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2IoZXJyKTsgfSwgMCk7XG5cbiAgICAgICAgLy8gc3VwcGx5IGRlZmF1bHQgb3B0aW9uc1xuICAgICAgICBpZiAoIW9wdHMud2luZG93X25hbWUpIG9wdHMud2luZG93X25hbWUgPSBudWxsO1xuICAgICAgICBpZiAoIW9wdHMud2luZG93X2ZlYXR1cmVzIHx8IGlzRmVubmVjKCkpIG9wdHMud2luZG93X2ZlYXR1cmVzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIG9wdHMucGFyYW1zIG1heSBiZSB1bmRlZmluZWRcblxuICAgICAgICB2YXIgaWZyYW1lO1xuXG4gICAgICAgIC8vIHNhbml0eSBjaGVjaywgYXJlIHVybCBhbmQgcmVsYXlfdXJsIHRoZSBzYW1lIG9yaWdpbj9cbiAgICAgICAgdmFyIG9yaWdpbiA9IGV4dHJhY3RPcmlnaW4ob3B0cy51cmwpO1xuICAgICAgICBpZiAob3JpZ2luICE9PSBleHRyYWN0T3JpZ2luKG9wdHMucmVsYXlfdXJsKSkge1xuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2IoJ2ludmFsaWQgYXJndW1lbnRzOiBvcmlnaW4gb2YgdXJsIGFuZCByZWxheV91cmwgbXVzdCBtYXRjaCcpO1xuICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1lc3NhZ2VUYXJnZXQ7XG5cbiAgICAgICAgaWYgKGlzSUUpIHtcbiAgICAgICAgICAvLyBmaXJzdCB3ZSBuZWVkIHRvIGFkZCBhIFwicmVsYXlcIiBpZnJhbWUgdG8gdGhlIGRvY3VtZW50IHRoYXQncyBzZXJ2ZWRcbiAgICAgICAgICAvLyBmcm9tIHRoZSB0YXJnZXQgZG9tYWluLiAgV2UgY2FuIHBvc3RtZXNzYWdlIGludG8gYSBpZnJhbWUsIGJ1dCBub3QgYVxuICAgICAgICAgIC8vIHdpbmRvd1xuICAgICAgICAgIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgICAgICAgLy8gaWZyYW1lLnNldEF0dHJpYnV0ZSgnbmFtZScsIGZyYW1lbmFtZSk7XG4gICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc3JjJywgb3B0cy5yZWxheV91cmwpO1xuICAgICAgICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnbmFtZScsIFJFTEFZX0ZSQU1FX05BTUUpO1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICBtZXNzYWdlVGFyZ2V0ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdyA9IHdpbmRvdy5vcGVuKG9wdHMudXJsLCBvcHRzLndpbmRvd19uYW1lLCBvcHRzLndpbmRvd19mZWF0dXJlcyk7XG5cbiAgICAgICAgaWYgKCFtZXNzYWdlVGFyZ2V0KSBtZXNzYWdlVGFyZ2V0ID0gdztcblxuICAgICAgICAvLyBsZXRzIGxpc3RlbiBpbiBjYXNlIHRoZSB3aW5kb3cgYmxvd3MgdXAgYmVmb3JlIHRlbGxpbmcgdXNcbiAgICAgICAgdmFyIGNsb3NlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAodyAmJiB3LmNsb3NlZCkge1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgIGNiKCd1bmtub3duIGNsb3NlZCB3aW5kb3cnKTtcbiAgICAgICAgICAgICAgY2IgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICB2YXIgcmVxID0gSlNPTi5zdHJpbmdpZnkoe2E6ICdyZXF1ZXN0JywgZDogb3B0cy5wYXJhbXN9KTtcblxuICAgICAgICAvLyBjbGVhbnVwIG9uIHVubG9hZFxuICAgICAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICAgIGlmIChpZnJhbWUpIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICBpZnJhbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKGNsb3NlSW50ZXJ2YWwpIGNsb3NlSW50ZXJ2YWwgPSBjbGVhckludGVydmFsKGNsb3NlSW50ZXJ2YWwpO1xuICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKHdpbmRvdywgJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xuICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKHdpbmRvdywgJ3VubG9hZCcsIGNsZWFudXApO1xuICAgICAgICAgIGlmICh3KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3LmNsb3NlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChzZWN1cml0eVZpb2xhdGlvbikge1xuICAgICAgICAgICAgICAvLyBUaGlzIGhhcHBlbnMgaW4gT3BlcmEgMTIgc29tZXRpbWVzXG4gICAgICAgICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9icm93c2VyaWQvaXNzdWVzLzE4NDRcbiAgICAgICAgICAgICAgbWVzc2FnZVRhcmdldC5wb3N0TWVzc2FnZShDTE9TRV9DTUQsIG9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHcgPSBtZXNzYWdlVGFyZ2V0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkTGlzdGVuZXIod2luZG93LCAndW5sb2FkJywgY2xlYW51cCk7XG5cbiAgICAgICAgZnVuY3Rpb24gb25NZXNzYWdlKGUpIHtcbiAgICAgICAgICBpZiAoZS5vcmlnaW4gIT09IG9yaWdpbikgeyByZXR1cm47IH1cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGQgPSBKU09OLnBhcnNlKGUuZGF0YSk7XG4gICAgICAgICAgICBpZiAoZC5hID09PSAncmVhZHknKSBtZXNzYWdlVGFyZ2V0LnBvc3RNZXNzYWdlKHJlcSwgb3JpZ2luKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGQuYSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgIGNiKGQuZCk7XG4gICAgICAgICAgICAgICAgY2IgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGQuYSA9PT0gJ3Jlc3BvbnNlJykge1xuICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgIGNiKG51bGwsIGQuZCk7XG4gICAgICAgICAgICAgICAgY2IgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaChlcnIpIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWRkTGlzdGVuZXIod2luZG93LCAnbWVzc2FnZScsIG9uTWVzc2FnZSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjbG9zZTogY2xlYW51cCxcbiAgICAgICAgICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHcuZm9jdXMoKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIElFNyBibG93cyB1cCBoZXJlLCBkbyBub3RoaW5nXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgb25PcGVuOiBmdW5jdGlvbihjYikge1xuICAgICAgICB2YXIgbyA9IFwiKlwiO1xuICAgICAgICB2YXIgbXNnVGFyZ2V0ID0gaXNJRSA/IGZpbmRSZWxheSgpIDogd2luZG93Lm9wZW5lcjtcbiAgICAgICAgaWYgKCFtc2dUYXJnZXQpIHRocm93IFwiY2FuJ3QgZmluZCByZWxheSBmcmFtZVwiO1xuICAgICAgICBmdW5jdGlvbiBkb1Bvc3QobXNnKSB7XG4gICAgICAgICAgbXNnID0gSlNPTi5zdHJpbmdpZnkobXNnKTtcbiAgICAgICAgICBpZiAoaXNJRSkgbXNnVGFyZ2V0LmRvUG9zdChtc2csIG8pO1xuICAgICAgICAgIGVsc2UgbXNnVGFyZ2V0LnBvc3RNZXNzYWdlKG1zZywgbyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbk1lc3NhZ2UoZSkge1xuICAgICAgICAgIC8vIG9ubHkgb25lIG1lc3NhZ2UgZ2V0cyB0aHJvdWdoLCBidXQgbGV0J3MgbWFrZSBzdXJlIGl0J3MgYWN0dWFsbHlcbiAgICAgICAgICAvLyB0aGUgbWVzc2FnZSB3ZSdyZSBsb29raW5nIGZvciAob3RoZXIgY29kZSBtYXkgYmUgdXNpbmdcbiAgICAgICAgICAvLyBwb3N0bWVzc2FnZSkgLSB3ZSBkbyB0aGlzIGJ5IGVuc3VyaW5nIHRoZSBwYXlsb2FkIGNhblxuICAgICAgICAgIC8vIGJlIHBhcnNlZCwgYW5kIGl0J3MgZ290IGFuICdhJyAoYWN0aW9uKSB2YWx1ZSBvZiAncmVxdWVzdCcuXG4gICAgICAgICAgdmFyIGQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGQgPSBKU09OLnBhcnNlKGUuZGF0YSk7XG4gICAgICAgICAgfSBjYXRjaChlcnIpIHsgfVxuICAgICAgICAgIGlmICghZCB8fCBkLmEgIT09ICdyZXF1ZXN0JykgcmV0dXJuO1xuICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKHdpbmRvdywgJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xuICAgICAgICAgIG8gPSBlLm9yaWdpbjtcbiAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgc2V0VGltZW91dCBpcyBjcml0aWNhbGx5IGltcG9ydGFudCBmb3IgSUU4IC1cbiAgICAgICAgICAgIC8vIGluIGllOCBzb21ldGltZXMgYWRkTGlzdGVuZXIgZm9yICdtZXNzYWdlJyBjYW4gc3luY2hyb25vdXNseVxuICAgICAgICAgICAgLy8gY2F1c2UgeW91ciBjYWxsYmFjayB0byBiZSBpbnZva2VkLiAgYXdlc29tZS5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNiKG8sIGQuZCwgZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgIGNiID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGRvUG9zdCh7YTogJ3Jlc3BvbnNlJywgZDogcn0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uRGllKGUpIHtcbiAgICAgICAgICBpZiAoZS5kYXRhID09PSBDTE9TRV9DTUQpIHtcbiAgICAgICAgICAgIHRyeSB7IHdpbmRvdy5jbG9zZSgpOyB9IGNhdGNoIChvX08pIHt9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGFkZExpc3RlbmVyKGlzSUUgPyBtc2dUYXJnZXQgOiB3aW5kb3csICdtZXNzYWdlJywgb25NZXNzYWdlKTtcbiAgICAgICAgYWRkTGlzdGVuZXIoaXNJRSA/IG1zZ1RhcmdldCA6IHdpbmRvdywgJ21lc3NhZ2UnLCBvbkRpZSk7XG5cbiAgICAgICAgLy8gd2UgY2Fubm90IHBvc3QgdG8gb3VyIHBhcmVudCB0aGF0IHdlJ3JlIHJlYWR5IGJlZm9yZSB0aGUgaWZyYW1lXG4gICAgICAgIC8vIGlzIGxvYWRlZC4gKElFIHNwZWNpZmljIHBvc3NpYmxlIGZhaWx1cmUpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZG9Qb3N0KHthOiBcInJlYWR5XCJ9KTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgLy8gdGhpcyBjb2RlIHNob3VsZCBuZXZlciBiZSBleGVjdHVlZCBvdXRzaWRlIElFXG4gICAgICAgICAgYWRkTGlzdGVuZXIobXNnVGFyZ2V0LCAnbG9hZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGRvUG9zdCh7YTogXCJyZWFkeVwifSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3aW5kb3cgaXMgdW5sb2FkZWQgYW5kIHRoZSBjbGllbnQgaGFzbid0IGNhbGxlZCBjYiwgaXQncyBhbiBlcnJvclxuICAgICAgICB2YXIgb25VbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gSUU4IGRvZXNuJ3QgbGlrZSB0aGlzLi4uXG4gICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihpc0lFID8gbXNnVGFyZ2V0IDogd2luZG93LCAnbWVzc2FnZScsIG9uRGllKTtcbiAgICAgICAgICB9IGNhdGNoIChvaFdlbGwpIHsgfVxuICAgICAgICAgIGlmIChjYikgZG9Qb3N0KHsgYTogJ2Vycm9yJywgZDogJ2NsaWVudCBjbG9zZWQgd2luZG93JyB9KTtcbiAgICAgICAgICBjYiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAvLyBleHBsaWNpdGx5IGNsb3NlIHRoZSB3aW5kb3csIGluIGNhc2UgdGhlIGNsaWVudCBpcyB0cnlpbmcgdG8gcmVsb2FkIG9yIG5hdlxuICAgICAgICAgIHRyeSB7IHdpbmRvdy5jbG9zZSgpOyB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgfTtcbiAgICAgICAgYWRkTGlzdGVuZXIod2luZG93LCAndW5sb2FkJywgb25VbmxvYWQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRldGFjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZW1vdmVMaXN0ZW5lcih3aW5kb3csICd1bmxvYWQnLCBvblVubG9hZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9wZW46IGZ1bmN0aW9uKHVybCwgd2lub3B0cywgYXJnLCBjYikge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYihcInVuc3VwcG9ydGVkIGJyb3dzZXJcIik7IH0sIDApO1xuICAgICAgfSxcbiAgICAgIG9uT3BlbjogZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2IoXCJ1bnN1cHBvcnRlZCBicm93c2VyXCIpOyB9LCAwKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59KSgpO1xuIl19
