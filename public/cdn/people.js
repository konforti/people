WinChan=function(){function c(a,b,c){a.attachEvent?a.attachEvent("on"+b,c):a.addEventListener&&a.addEventListener(b,c,!1)}function d(a,b,c){a.detachEvent?a.detachEvent("on"+b,c):a.removeEventListener&&a.removeEventListener(b,c,!1)}function e(){var a=-1,b=navigator.userAgent;if("Microsoft Internet Explorer"===navigator.appName){var c=new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");null!=c.exec(b)&&(a=parseFloat(RegExp.$1))}else if(b.indexOf("Trident")>-1){var c=new RegExp("rv:([0-9]{2,2}[.0-9]{0,})");null!==c.exec(b)&&(a=parseFloat(RegExp.$1))}return a>=8}function f(){try{var a=navigator.userAgent;return-1!=a.indexOf("Fennec/")||-1!=a.indexOf("Firefox/")&&-1!=a.indexOf("Android")}catch(b){}return!1}function g(){return window.JSON&&window.JSON.stringify&&window.JSON.parse&&window.postMessage}function h(a){/^https?:\/\//.test(a)||(a=window.location.href);var b=document.createElement("a");return b.href=a,b.protocol+"//"+b.host}function i(){window.location;for(var c=window.opener.frames,d=c.length-1;d>=0;d--)try{if(c[d].location.protocol===window.location.protocol&&c[d].location.host===window.location.host&&c[d].name===a)return c[d]}catch(e){}}var a="__winchan_relay_frame",b="die",j=e();return g()?{open:function(e,g){function q(){if(k&&document.body.removeChild(k),k=void 0,o&&(o=clearInterval(o)),d(window,"message",r),d(window,"unload",q),n)try{n.close()}catch(a){m.postMessage(b,l)}n=m=void 0}function r(a){if(a.origin===l)try{var b=JSON.parse(a.data);"ready"===b.a?m.postMessage(p,l):"error"===b.a?(q(),g&&(g(b.d),g=null)):"response"===b.a&&(q(),g&&(g(null,b.d),g=null))}catch(c){}}if(!g)throw"missing required callback argument";var i;e.url||(i="missing required 'url' parameter"),e.relay_url||(i="missing required 'relay_url' parameter"),i&&setTimeout(function(){g(i)},0),e.window_name||(e.window_name=null),(!e.window_features||f())&&(e.window_features=void 0);var k,l=h(e.url);if(l!==h(e.relay_url))return setTimeout(function(){g("invalid arguments: origin of url and relay_url must match")},0);var m;j&&(k=document.createElement("iframe"),k.setAttribute("src",e.relay_url),k.style.display="none",k.setAttribute("name",a),document.body.appendChild(k),m=k.contentWindow);var n=window.open(e.url,e.window_name,e.window_features);m||(m=n);var o=setInterval(function(){n&&n.closed&&(q(),g&&(g("unknown closed window"),g=null))},500),p=JSON.stringify({a:"request",d:e.params});return c(window,"unload",q),c(window,"message",r),{close:q,focus:function(){if(n)try{n.focus()}catch(a){}}}},onOpen:function(a){function g(a){a=JSON.stringify(a),j?f.doPost(a,e):f.postMessage(a,e)}function h(b){var c;try{c=JSON.parse(b.data)}catch(f){}c&&"request"===c.a&&(d(window,"message",h),e=b.origin,a&&setTimeout(function(){a(e,c.d,function(b){a=void 0,g({a:"response",d:b})})},0))}function k(a){if(a.data===b)try{window.close()}catch(c){}}var e="*",f=j?i():window.opener;if(!f)throw"can't find relay frame";c(j?f:window,"message",h),c(j?f:window,"message",k);try{g({a:"ready"})}catch(l){c(f,"load",function(){g({a:"ready"})})}var m=function(){try{d(j?f:window,"message",k)}catch(b){}a&&g({a:"error",d:"client closed window"}),a=void 0;try{window.close()}catch(c){}};return c(window,"unload",m),{detach:function(){d(window,"unload",m)}}}}:{open:function(a,b,c,d){setTimeout(function(){d("unsupported browser")},0)},onOpen:function(a){setTimeout(function(){a("unsupported browser")},0)}}}();
'use strict';

/**
 * EventEmitter.
 * @constructor
 */
var EventEmitter = function() {this._listeners = {}};
EventEmitter.prototype = {
  on: function(name, fn) {
    this._listeners[name] = this._listeners[name] || [];
    this._listeners[name].push(fn);
  },
  remove: function(name, fn) {
    fn && this._listeners[name] && this._listeners[name].splice(this._listeners[name].indexOf(fn), 1);
  },
  emit: function(name) {
    var fns = this._listeners[name] || [];
    for (var i = 0; i < fns.length; ++i) {
      try {
        fns[i].apply(this, [Array.prototype.slice.call(arguments, 1) || []]);
      }
      catch (err) {
        this.emit('error', err);
      }
    }
  }
};

/**
 * Array.prototype.contains
 * needle is the item you are searching for
 * this is a special variable that refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */
Array.prototype.contains = function ( needle ) {
  return array.indexOf(needle) > -1;
};

/**
 * Constructor.
 * @param options
 */
var People = function(options) {
  options = options || {};
  this.url = options.url || 'http://localhost:3000';
  this.loginElement = document.getElementById(options.loginElementID) || document.body;
  this.profileElement = document.getElementById(options.profileElementID) || document.body;

  if (this.getInfo() === null) {
    this.makeRequest('GET', this.url + '/remote/info/', {}, function (data) {
      var data = JSON.parse(data.responseText);
      if (data.success === true) {
        localStorage.setItem('people.info', JSON.stringify(data.info));
      }
    });
  }

  if (!this.isUser()) {
    localStorage.removeItem('people.user');
  }

  this.clickEvents();
};

/**
 * User data.
 */
People.prototype.getUser = function() {
  try {
    return JSON.parse(localStorage.getItem('people.user'));
  }
  catch(e) {
    return false;
  }
};

/**
 * App Info.
 */
People.prototype.getInfo = function() {
  try {
    return JSON.parse(localStorage.getItem('people.info'));
  }
  catch(e) {
    return false;
  }

};

/**
 * Check if the user is logged in.
 * @type {boolean}
 */
People.prototype.isUser = function() {
  return this.getCookie('people.sid').length > 0;
};

/**
 * Set ans app event emitter.
 * @type {EventEmitter}
 */
People.prototype.event = new EventEmitter();

/**
 * windowFeatures().
 */
People.prototype.windowFeatures = function() {
  var width = '750',
    height = '350',
    top = ((window.outerHeight - height) / 2).toString(),
    left = ((window.outerWidth - width) / 2).toString();

  return 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',scrollbars=0';
};

People.prototype.relayUrl = function() {
  return  this.url + '/cdn/winchan/relay.html';
};

/**
 * Register events.
 */
People.prototype.clickEvents = function () {
  var self = this;
  document.addEventListener('click', function (e) {

    // Elements ID
    switch (e.target.id) {
      case 'ppl-login-btn':
        self.makeRequest('POST', self.url + '/remote/login/', {
          username: document.getElementById('ppl-login-name').value,
          password: document.getElementById('ppl-login-pass').value
        }, function (data) {
          if (!self.errors(data)) {
            self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-register-btn':
        self.makeRequest('POST', self.url + '/remote/register/', {
          username: document.getElementById('register-name').value,
          email: document.getElementById('ppl-register-email').value,
          password: document.getElementById('ppl-register-pass').value
        }, function (data) {
          if (!self.errors(data)) {
            self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-forgot-btn':
        self.makeRequest('POST', self.url + '/remote/forgot/', {
          email: document.getElementById('ppl-forgot-email').value
        }, function (data) {
          if (!self.errors(data)) {
            self.showLogin({form: 'reset'});
          }
        });
        break;

      case 'ppl-forgot-reset-btn':
        self.makeRequest('POST', self.url + '/remote/forgot/reset/', {
          token: document.getElementById('ppl-forgot-reset-token').value,
          password: document.getElementById('ppl-forgot-reset-pass').value
        }, function (data) {
          if (!self.errors(data)) {
            self.event.emit('passwordreset', data);
            self.showLogin();
          }
        });
        break;

      case 'ppl-update-profile-btn':
        var elms = document.querySelectorAll('#ppl-profile-form input');
        var values = {sid: self.getCookie('people.sid'), fields: {}};
        for (var i = 0, elm; elm = elms[i]; ++i) {
          if (elm.name === 'csrf' || elm.name === 'username' || elm.name === 'email') {
            values[elm.name] = elm.value;
          }
          else {
            values.fields[elm.name] = elm.value;
          }
        }
        values.fields = JSON.stringify(values.fields);
        self.makeRequest('POST', self.url + '/remote/profile/', values, function (data) {
          if (!self.errors(data)) {
            self.event.emit('profileupdate', data);
            self.showProfile(data.responseText);
          }
        });
        break;

      case 'ppl-update-password-btn':
        var elms = document.querySelectorAll('#ppl-new-password input');
        var values = {sid: self.getCookie('people.sid')};
        for (var i = 0, elm; elm = elms[i]; ++i) {
          values[elm.name] = elm.value;
        }
        self.makeRequest('POST', self.url + '/remote/password/', values, function (data) {
          if (!self.errors(data)) {
            self.event.emit('passwordupdate', data);
            self.showProfile(data.responseText);
          }
        });
        break;

      case 'ppl-user-avatar':
      case 'ppl-user-name':
        self.showProfile();
        break;

      case 'ppl-user-logout':
        self.logout();
        break;
    }

    // Elements Class
    var classes = e.target.classList;
    if (classes.contains('ppl-social-login')) {
      var name = e.target.id.replace('ppl-login-', '');
      WinChan.open({
          url: self.url + '/remote/register/' + name + '/',
          relay_url: self.relayUrl(),
          window_features: self.windowFeatures()
        },
        function(err, r) {
          if (!err) {
            self.login(r.data);
          }
        });
    }
    else if (classes.contains('ppl-to-login')) {
      self.showLogin();
    }
    else if (classes.contains('ppl-to-register')) {
      self.showLogin({form: 'register'});
    }
    else if (classes.contains('ppl-to-forgot')) {
      self.showLogin({form: 'forgot'});
    }
    else if (classes.contains('ppl-verify-email')) {
      self.makeRequest('POST', self.url + '/remote/verification/', {}, function (data) {
        var message = 'A verification mail sent to your email address.';
        if (!self.errors(data, message)) {
          // Wait.
        }
      });
    }
    else if (classes.contains('ppl-close-btn')) {
      var parent = e.target.parentNode;
      if (parent) parent.outerHTML = '';
    }
    else if (classes.contains('ppl-change-password')) {
      var el = document.getElementById('ppl-new-password');
      if (el) el.classList.toggle('hidden');
    }
    else if (classes.contains('ppl-connect-btn')) {
      WinChan.open({
          url: self.url + e.target.getAttribute('data-href'),
          relay_url: self.relayUrl(),
          window_features: self.windowFeatures()
        },
        function(err, r) {
          if (!err) {
            e.target.classList.remove('ppl-connect-btn');
            e.target.classList.add('ppl-disconnect-btn');
            e.target.setAttribute('data-href', e.target.getAttribute('data-href').replace('/connect/', '/disconnect/'));
            e.target.innerHTML = e.target.innerHTML.replace('Connect', 'Disconnect');
          }
        });
    }
    else if (classes.contains('ppl-disconnect-btn')) {
      var url = e.target.getAttribute('data-href');

      self.makeRequest('GET', self.url + url, {}, function (data) {
        if (!self.errors(data, 'Disconnect successfully')) {
          e.target.classList.remove('ppl-disconnect-btn');
          e.target.classList.add('ppl-connect-btn');
          e.target.setAttribute('data-href', e.target.getAttribute('data-href').replace('/disconnect/', '/connect/'));
          e.target.innerHTML = e.target.innerHTML.replace('Disconnect', 'Connect');
        }
      });
    }
  });
};

/**
 * Make AJAX request.
 * @param method
 * @param url
 * @param data
 * @param next
 * @returns {boolean}
 */
People.prototype.makeRequest = function (method, url, data, next) {
  var throb = document.getElementById('throb');
  if (throb) {
    throb.parentNode.removeChild(throb);
  }

  throb  = document.createElement('img');
  throb.id = 'throb';
  throb.src = this.url + '/media/ajax-pulse.gif';
  throb.style.position = 'absolute';
  throb.style.zIndex = '9999';
  document.body.appendChild(throb);
  document.onmousemove = function(e) {
    throb.style.left = e.pageX + 15 + 'px';
    throb.style.top = e.pageY + 'px';
  };

  var httpRequest = new XMLHttpRequest(),
    body = '',
    query = '';

  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    return false;
  }

  var str = [];
  for (var p in data) {
    if (data.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
    }
  }
  if (method == 'GET') {
    query = str.length > 0 ? '?' + str.join('&') : '';
  }
  else {
    body = str.join('&');

  }

  httpRequest.open(method, url + query, true);
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4 && httpRequest.status === 200) {
      var throb = document.getElementById('throb');
      if (throb) {
        throb.parentNode.removeChild(throb);
      }

      next(httpRequest);
    }
  };

  httpRequest.withCredentials = true;
  httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  httpRequest.send(body);
};


/**
 * Set Cookies.
 * @param cname
 * @param cvalue
 * @param exdays
 */
People.prototype.setCookie = function (name, value, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = 'expires=' + d.toUTCString();
  document.cookie = name + '=' + value + '; ' + expires;
};

/**
 * Get Cookies.
 * @param cname
 * @returns {string}
 */
People.prototype.getCookie = function (name) {
  var name = name + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

/**
 * Erase Cookie.
 * @param name
 */
People.prototype.eraseCookie = function (name) {
  this.setCookie(name, '', -1);
};

/**
 * Trigger on cookie set or change.
 * @param name
 * @param callback
 * @returns {*}
 */
People.prototype.cookieRegistry = [];
People.prototype.oncookieset = function (name, callback) {
  setTimeout(this.oncookieset, 100);
  if (this.cookieRegistry[name]) {
    if (this.getCookie(name) != this.cookieRegistry[name]) {
      this.cookieRegistry[name] = this.getCookie(name);
      return callback();
    }
  }
  else {
    this.cookieRegistry[name] = this.getCookie(name);
  }
};

/**
 * Alerts().
 * @param data
 * @returns {boolean}
 */
People.prototype.errors = function(data, messege) {
  messege = messege || '';
  data = JSON.parse(data.responseText);

  function ele() {
    var wrp = document.querySelector('.ppl-alerts');
    if (wrp) {
      wrp.innerHTML = '<div class="ppl-alert"><div class="ppl-close-btn">&times</div></div>';
      return wrp.querySelector('.ppl-alert');
    }

    return false;
  }

  if (data.success === true) {
    var el = ele();
    if (el) {
      el.classList.add('ppl-info');
      el.innerHTML += '<p>' + messege + '</p>'
    }

    return false;
  }
  else {
    var errors = '';
    var errfor = '';
    for (var i = 0, error; error = data.errors[i]; ++i) {
      errors += error + '\n';
    }
    for (var key in data.errfor) {
      errfor += key + ': ' + data.errfor[key] + '\n';
    }

    var el = ele();
    if (el) {
      el.classList.add('ppl-error');
      var err = (errors) ? errors + '\n' : '';
      err += (errfor) ? errfor + '\n' : '';
      el.innerHTML += '<p>' + err + '</p>'
    }

    return true;
  }
};

/**
 * After user login process.
 */
People.prototype.login = function (data) {
  // Set cookies.
  this.setCookie('people.sid', data.sid, 14);

  // Save Shallow user to local storage.
  localStorage.setItem('people.user', JSON.stringify(data.user));
  this.hideLogin();
  this.event.emit('login', data);
};

/**
 * Logout current user.
 */
People.prototype.logout = function () {
  this.eraseCookie('people.sid');
  localStorage.removeItem('people.user');
  this.hideUser();
  this.hideProfile();
  this.event.emit('logout');
};

/**
 * Logged-in user block.
 */
People.prototype.showUser = function (elementID) {
  if (this.isUser()) {
    var user = this.getUser();
    if (user) {
      var output = '';
      output += '<div id="ppl-user-block">';
      output += '<a href="javascript:void(0)"><img id="ppl-user-avatar" src="' + user.avatar + '"></a>';
      output += '<a id="ppl-user-name" href="javascript:void(0)">' + user.username + '</a> | ';
      output += '<a id="ppl-user-logout" href="javascript:void(0)">Logout</a>';
      output += '</div>';

      var el = document.getElementById(elementID);
      if (el) el.innerHTML = output;
    }
  }
};

/**
 * Remove user block.
 */
People.prototype.hideUser = function () {
  var el = document.getElementById('ppl-user-block');
  if (el) el.outerHTML = '';
};

/**
 * login/register block.
 */
People.prototype.loginForm = function (socials) {
  var output = '';
  output += '<h3 class="title">Login</h3>';
  output += '<form class="ppl-login-form">';
  output += '<div class="ppl-form-field"><input id="ppl-login-name" type="textfield" placeholder="Name"></div>';
  output += '<div class="ppl-form-field"><input id="ppl-login-pass" type="password" placeholder="Password"></div>';
  output += '<a id="ppl-login-btn" class="submit" href="javascript:void(0)">Login</a> ';
  output += '</form>';

  if (socials && socials.length > 0) {
    output += '<H4 class="or">OR</H4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      output += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)"><i class="icon-' + name + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</a> ';
    }
  }

  output += '<div class="footer">';
  output += '<a class="ppl-to-register" href="javascript:void(0)">Register</a>';
  output += '<a class="ppl-to-forgot" href="javascript:void(0)">Forgot password</a>';
  output += '</div>'
  return output;
};

/**
 * Register form.
 * @param socials
 * @returns {string}
 */
People.prototype.registerForm = function (socials) {
  var output = '';
  output += '<h3>Register</h3>';
  output += '<form class="ppl-register-form">';
  output += '<div class="ppl-form-field"><input id="ppl-register-name" type="textfield" placeholder="Name"></div>';
  output += '<div class="ppl-form-field"><input id="ppl-register-email" type="textfield" placeholder="Email"></div>';
  output += '<div class="ppl-form-field"><input id="ppl-register-pass" type="password" placeholder="Password"></div>';
  output += '<a id="ppl-register-btn" class="submit" href="javascript:void(0)">Register</a> ';
  output += '</form>';

  if (socials && socials.length > 0) {
    output += '<H4 class="or">OR</H4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      output += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)"><i class="icon-' + name + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</a>';
    }
  }

  output += '<div class="footer">';
  output += '<a class="ppl-to-login" href="javascript:void(0)">Login</a>';
  output += '</div>'
  return output;
};

/**
 * Forgot password form.
 * @returns {string}
 */
People.prototype.forgotForm = function () {
  var output = '';
  output += '<h3>Forgot Password</h3>'
  output += '<form class="ppl-forgot-form">';
  output += '<div class="ppl-form-field"><input id="ppl-forgot-email" type="email" placeholder="Email"></div>';
  output += '<a id="ppl-forgot-btn" class="submit" href="javascript:void(0)">Send</a> ';
  output += '</form>';

  output += '<div class="footer">';
  output += '<a class="ppl-to-login" href="javascript:void(0)">Back to login</a>';
  output += '</div>'
  return output;
};

/**
 * Reset forgot password form.
 * @returns {string}
 */
People.prototype.forgotResetForm = function () {
  var output = '';
  output += '<h3>Reset password</h3>';
  output += '<form class="ppl-forgot-reset-form">';
  output += '<div class="ppl-form-field"><textarea id="ppl-forgot-reset-token" placeholder="Verification Token"></textarea></div>';
  output += '<div class="ppl-form-field"><input id="ppl-forgot-reset-pass" type="password" placeholder="New Password"></div>';
  output += '<a id="ppl-forgot-reset-btn" class="submit" href="javascript:void(0)">Update Password</a> ';
  output += '</form>';

  return output;
};

/**
 * Remove login block.
 */
People.prototype.hideLogin = function () {
  var el = document.getElementById('ppl-login-block');
  if (el) el.outerHTML = '';
};

/**
 * Display login block.
 * @param options
 */
People.prototype.showLogin = function (options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  else if (typeof options === 'undefined') {
    callback = null;
    options = {};
  }
  if (!this.isUser()) {
    var form = options.form || 'login';
    var info = this.getInfo();
    var socials = info ? info.socials : [];
    var output = '';
    output += '<div class="ppl-block" id="ppl-login-block">';
    output += '<div class="ppl-close-btn">&times</div>';
    output += '<div class="ppl-alerts"></div>';
    switch (form) {
      case 'login':
        output += this.loginForm(socials);
        this.event.on('login', function(e) {
          if (callback) callback.call(this, e);
        });
        break;

      case 'register':
        output += this.registerForm(socials);
        this.event.on('login', function(e) {
          if (callback) callback.call(this, e);
        });
        break;

      case 'forgot':
        output += this.forgotForm();
        break;

      case 'reset':
        output += this.forgotResetForm();
        break;
    }
    output += '</div>';

    this.hideLogin();
    if (this.loginElement) this.loginElement.innerHTML += output;
  }
};

/**
 * Display Logged-in user profile..
 * @param profile
 */
People.prototype.showProfile = function (profile) {
  var self = this;
  if (!this.isUser()) {
    return false;
  }

  if (!profile) {
    this.makeRequest('GET', this.url + '/remote/profile/', {sid: this.getCookie('people.sid')}, function (data) {
      profile = data.responseText;
      renderProfile();
    });
  }
  else {
    renderProfile();
  }

  function renderProfile() {
    var user = self.getUser();
    if (user) {
      profile = JSON.parse(profile);
      var output = '';
      output += '<div class="ppl-block" id="ppl-profile-block">';
      output += '<div class="ppl-close-btn">&times</div>';
      output += '<div class="ppl-alerts"></div>';

      if (profile && profile.html) {
        output += profile.html;
      }

      output += '</div>';

      self.hideProfile();
      if (self.profileElement) self.profileElement.innerHTML += output;
    }
  }
};

/**
 * Remove profile block.
 */
People.prototype.hideProfile = function () {
  var el = document.getElementById('ppl-profile-block');
  if (el) el.outerHTML = '';
};
