'use strict';

// winchan (https://github.com/mozilla/winchan/blob/master/winchan.js)
var WinChan=function(){function a(a,b,c){a.attachEvent?a.attachEvent("on"+b,c):a.addEventListener&&a.addEventListener(b,c,!1)}function b(a,b,c){a.detachEvent?a.detachEvent("on"+b,c):a.removeEventListener&&a.removeEventListener(b,c,!1)}function c(){var a=-1,b=navigator.userAgent;if("Microsoft Internet Explorer"===navigator.appName){var c=new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");null!=c.exec(b)&&(a=parseFloat(RegExp.$1))}else if(b.indexOf("Trident")>-1){var c=new RegExp("rv:([0-9]{2,2}[.0-9]{0,})");null!==c.exec(b)&&(a=parseFloat(RegExp.$1))}return a>=8}function d(){try{var a=navigator.userAgent;return-1!=a.indexOf("Fennec/")||-1!=a.indexOf("Firefox/")&&-1!=a.indexOf("Android")}catch(b){}return!1}function e(){return window.JSON&&window.JSON.stringify&&window.JSON.parse&&window.postMessage}function f(a){/^https?:\/\//.test(a)||(a=window.location.href);var b=document.createElement("a");return b.href=a,b.protocol+"//"+b.host}function g(){for(var a=(window.location,window.opener.frames),b=a.length-1;b>=0;b--)try{if(a[b].location.protocol===window.location.protocol&&a[b].location.host===window.location.host&&a[b].name===h)return a[b]}catch(c){}}var h="__winchan_relay_frame",i="die",j=c();return e()?{open:function(c,e){function g(){if(m&&document.body.removeChild(m),m=void 0,q&&(q=clearInterval(q)),b(window,"message",k),b(window,"unload",g),p)try{p.close()}catch(a){o.postMessage(i,n)}p=o=void 0}function k(a){if(a.origin===n)try{var b=JSON.parse(a.data);"ready"===b.a?o.postMessage(r,n):"error"===b.a?(g(),e&&(e(b.d),e=null)):"response"===b.a&&(g(),e&&(e(null,b.d),e=null))}catch(c){}}if(!e)throw"missing required callback argument";var l;c.url||(l="missing required 'url' parameter"),c.relay_url||(l="missing required 'relay_url' parameter"),l&&setTimeout(function(){e(l)},0),c.window_name||(c.window_name=null),(!c.window_features||d())&&(c.window_features=void 0);var m,n=f(c.url);if(n!==f(c.relay_url))return setTimeout(function(){e("invalid arguments: origin of url and relay_url must match")},0);var o;j&&(m=document.createElement("iframe"),m.setAttribute("src",c.relay_url),m.style.display="none",m.setAttribute("name",h),document.body.appendChild(m),o=m.contentWindow);var p=window.open(c.url,c.window_name,c.window_features);o||(o=p);var q=setInterval(function(){p&&p.closed&&(g(),e&&(e("unknown closed window"),e=null))},500),r=JSON.stringify({a:"request",d:c.params});return a(window,"unload",g),a(window,"message",k),{close:g,focus:function(){if(p)try{p.focus()}catch(a){}}}},onOpen:function(c){function d(a){a=JSON.stringify(a),j?k.doPost(a,h):k.postMessage(a,h)}function e(a){var f;try{f=JSON.parse(a.data)}catch(g){}f&&"request"===f.a&&(b(window,"message",e),h=a.origin,c&&setTimeout(function(){c(h,f.d,function(a){c=void 0,d({a:"response",d:a})})},0))}function f(a){if(a.data===i)try{window.close()}catch(b){}}var h="*",k=j?g():window.opener;if(!k)throw"can't find relay frame";a(j?k:window,"message",e),a(j?k:window,"message",f);try{d({a:"ready"})}catch(l){a(k,"load",function(a){d({a:"ready"})})}var m=function(){try{b(j?k:window,"message",f)}catch(a){}c&&d({a:"error",d:"client closed window"}),c=void 0;try{window.close()}catch(e){}};return a(window,"unload",m),{detach:function(){b(window,"unload",m)}}}}:{open:function(a,b,c,d){setTimeout(function(){d("unsupported browser")},0)},onOpen:function(a){setTimeout(function(){a("unsupported browser")},0)}}}();

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
 * getScript().
 * @param url
 * @param callback
 */
var getScript = function(url, callback) {
  var js = document.createElement('script');
  js.src = url;
  document.getElementsByTagName("head")[0].appendChild(js);

  if (typeof callback === 'function') callback();
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
 * urlBase64Decode().
 * @param str
 * @returns {string}
 */
var urlBase64Decode = function(str) {
  var output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: {break;}
    case 2: {output += '=='; break;}
    case 3: {output += '=';  break;}
    default: {throw 'Illegal base64url string!';}
  }
  return decodeURIComponent(escape(window.atob(output)));
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
    this.ajax('GET', this.url + '/remote/info/', {}, function (data) {
      var data = JSON.parse(data.responseText);
      if (data.success === true) {
        sessionStorage.setItem('people.info', JSON.stringify(data.info));
      }
    });
  }

  if (!this.isUser()) {
    sessionStorage.removeItem('people.user');
  }

  this.clickEvents();
};

/**
 * User data.
 */
People.prototype.getUser = function() {
  try {
    return JSON.parse(sessionStorage.getItem('people.user'));
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
    return JSON.parse(sessionStorage.getItem('people.info'));
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
  return this.getCookie('people.jwt').length > 0;
};

/**
 * Set Cookies.
 * @param name
 * @param value
 * @param exdays
 */
People.prototype.setCookie = function (name, value, exsec) {
  var d = new Date();
  d.setTime(d.getTime() + (exsec * 1000));
  var expires = 'expires=' + d.toUTCString();
  document.cookie = name + '=' + value + '; ' + expires;
};

/**
 * Get Cookies.
 * @param name
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
    var wrp = document.querySelectorAll('.ppl-alerts');
    var n = 0;//wrp.length - 1;
    if (wrp) {
      wrp[n].innerHTML = '<div class="ppl-alert"><div class="ppl-close-btn">&times</div></div>';
      return wrp[n].querySelector('.ppl-alert');
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
  return  this.url + '/cdn/relay.html';
};

//::: AJAX ::://

/**
 * addThrob();
 */
People.prototype.addThrob = function () {
  this.removeThrob();
  var throb  = document.createElement('img');
  throb.id = 'throb';
  throb.src = this.url + '/media/ajax-pulse.gif';
  throb.style.position = 'absolute';
  throb.style.zIndex = '9999';
  document.body.appendChild(throb);
  document.onmousemove = function(e) {
    throb.style.left = e.pageX + 15 + 'px';
    throb.style.top = e.pageY + 'px';
  };
};

/**
 * removeThrob().
 */
People.prototype.removeThrob = function () {
  var throb = document.getElementById('throb');
  if (throb) throb.parentNode.removeChild(throb);
};

/**
 * Make AJAX request.
 * @param method
 * @param url
 * @param data
 * @param next
 * @returns {boolean}
 */
People.prototype.ajax = function (method, url, data, next) {
  var _self = this;
  _self.addThrob();

  var xhr = new XMLHttpRequest(), body = '', query = '';
  if (!xhr) {
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

  xhr.open(method, url + query, true);
  xhr.withCredentials = true;
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('Authorization', 'Bearer ' + this.getCookie('people.jwt'));
  xhr.addEventListener('load', function(ev) {
    _self.removeThrob();
    if (xhr.getResponseHeader('JWTRefresh')) {
      var info = _self.getInfo();
      _self.setCookie('people.jwt', xhr.getResponseHeader('JWTRefresh'), info.sessionExp);
    }

    next(xhr);
  }, false);

  xhr.send(body);
};

//::: Login / Logout ::://

/**
 * After user login process.
 */
People.prototype.login = function (data) {
  // Save Shallow user to local storage.
  var payload = data.jwt.split('.')[1];
  payload = urlBase64Decode(payload);
  var obj = JSON.parse(payload);
  if (obj.twostep === 'on') {
    this.showLogin({form: 'twostep'});
    this.setCookie('people.jwt', data.jwt, 60*60);
  }
  else {
    sessionStorage.setItem('people.user', payload);

    // Set cookies.
    var info = this.getInfo();
    this.setCookie('people.jwt', data.jwt, info.sessionExp);
    this.hideBlock('ppl-login-block');
    this.event.emit('login', data);
  }
};

/**
 * Logout current user.
 */
People.prototype.logout = function () {
  this.eraseCookie('people.jwt');
  sessionStorage.removeItem('people.user');
  this.hideUser();
  this.hideBlock('ppl-profile-block');
  this.event.emit('logout');
};

//::: User Block ::://

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

//::: Block templates ::://

/**
 * Block.
 * @param opt
 * @returns {string}
 */
People.prototype.renderBlock = function (opt) {
  var output = '';
  output += '<div class="ppl-block" id="' + opt.id + '">';
  output += '<div class="ppl-close-btn">&times</div>';
  output += '<div class="ppl-alerts"></div>';
  if (opt.title) {
    output += '<h3 class="block-title">' + opt.title + '</h3>';
  }
  if (opt.body) {
    output += '<div class="block-body">' + opt.body + '</div>';
  }
  if (opt.footer) {
    output += '<div class="block-footer">' + opt.footer + '</div>';
  }
  output += '</div>';

  return output;
};

/**
 * Show Block
 * @param opt
 */
People.prototype.showBlock = function (opt, element) {
  this.hideBlock(opt.id);
  if (typeof element !== 'undefined') {
    element.innerHTML += this.renderBlock(opt);
  }
  else {
    this.loginElement.innerHTML += this.renderBlock(opt);
  }
};

/**
 * Hide Block
 * @param id
 */
People.prototype.hideBlock = function (id) {
  var el = document.getElementById(id);
  if (el) el.outerHTML = '';
};

/**
 * login/register block.
 */
People.prototype.loginForm = function (socials) {
  var opt = {};
  opt.id = 'ppl-login-block';
  opt.title = 'Login';

  opt.body = '';
  opt.body += '<form class="ppl-login-form">';
  opt.body += '<div class="ppl-form-field"><input id="ppl-login-name" type="textfield" placeholder="Name"></div>';
  opt.body += '<div class="ppl-form-field"><input id="ppl-login-pass" type="password" placeholder="Password"></div>';
  opt.body += '<a id="ppl-login-btn" class="submit" href="javascript:void(0)">Login</a> ';
  opt.body += '</form>';

  if (socials && socials.length > 0) {
    opt.body += '<H4 class="or">OR</H4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      opt.body += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)"><i class="icon-' + name + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</a> ';
    }
  }

  opt.footer = '';
  opt.footer += '<div class="footer">';
  opt.footer += '<a class="ppl-to-register" href="javascript:void(0)">Register</a>';
  opt.footer += '<a class="ppl-to-forgot" href="javascript:void(0)">Forgot password</a>';
  opt.footer += '</div>';

  return opt;
};

/**
 * Register form.
 * @param socials
 * @returns {{}}
 */
People.prototype.registerForm = function (socials) {
  var opt = {};
  opt.id = 'ppl-login-block';
  opt.title = 'Register';

  opt.body = '';
  opt.body += '<form class="ppl-register-form">';
  opt.body += '<div class="ppl-form-field"><input id="ppl-register-name" type="textfield" placeholder="Name"></div>';
  opt.body += '<div class="ppl-form-field"><input id="ppl-register-email" type="textfield" placeholder="Email"></div>';
  opt.body += '<div class="ppl-form-field"><input id="ppl-register-pass" type="password" placeholder="Password"></div>';
  opt.body += '<a id="ppl-register-btn" class="submit" href="javascript:void(0)">Register</a> ';
  opt.body += '</form>';

  if (socials && socials.length > 0) {
    opt.body += '<H4 class="or">OR</H4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      opt.body += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)"><i class="icon-' + name + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</a>';
    }
  }

  opt.footer = '';
  opt.footer += '<div class="footer">';
  opt.footer += '<a class="ppl-to-login" href="javascript:void(0)">Login</a>';
  opt.footer += '</div>'

  return opt;
};

/**
 * Forgot password form.
 * @returns {string}
 */
People.prototype.forgotForm = function () {
  var opt = {};
  opt.id = 'ppl-login-block';
  opt.title = 'Forgot Password';

  opt.body = '';
  opt.body += '<form class="ppl-forgot-form">';
  opt.body += '<div class="ppl-form-field"><input id="ppl-forgot-email" type="email" placeholder="Email"></div>';
  opt.body += '<a id="ppl-forgot-btn" class="submit" href="javascript:void(0)">Send</a> ';
  opt.body += '</form>';

  opt.footer = '';
  opt.footer += '<div class="footer">';
  opt.footer += '<a class="ppl-to-login" href="javascript:void(0)">Back to login</a>';
  opt.footer += '</div>'

  return opt;
};

/**
 * Reset forgot password form.
 * @returns {{}}
 */
People.prototype.forgotResetForm = function () {
  var opt = {};
  opt.id = 'ppl-login-block';
  opt.title = 'Reset password';

  opt.body = '';
  opt.body += '<form class="ppl-forgot-reset-form">';
  opt.body += '<div class="ppl-form-field"><textarea id="ppl-forgot-reset-token" placeholder="Verification Token"></textarea></div>';
  opt.body += '<div class="ppl-form-field"><input id="ppl-forgot-reset-pass" type="password" placeholder="New Password"></div>';
  opt.body += '<a id="ppl-forgot-reset-btn" class="submit" href="javascript:void(0)">Update Password</a> ';
  opt.body += '</form>';

  return opt;
};

/**
 * Reset forgot password form.
 * @returns {{}}
 */
People.prototype.twostepLoginForm = function () {
  var opt = {};
  opt.id = 'ppl-login-block';
  opt.title = '2 Step Verification';

  opt.body = '';
  opt.body += '<form class="ppl-twostep-login-form">';
  opt.body += '<div class="ppl-form-field"><input id="ppl-twostep-login-code" type="password" placeholder="Verification Code"></div>';
  opt.body += '<a id="ppl-twostep-login-btn" class="submit" href="javascript:void(0)">Login</a> ';
  opt.body += '</form>';

  return opt;
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
    var opt = {};
    switch (form) {
      case 'login':
        opt = this.loginForm(socials);
        this.event.on('login', function(e) {
          if (callback) callback.call(this, e);
        });
        break;

      case 'register':
        opt = this.registerForm(socials);
        this.event.on('login', function(e) {
          if (callback) callback.call(this, e);
        });
        break;

      case 'forgot':
        opt = this.forgotForm();
        break;

      case 'reset':
        opt = this.forgotResetForm();
        break;

      case 'twostep':
        opt = this.twostepLoginForm();
        break;
    }

    this.hideBlock(opt.id);
    this.showBlock(opt);
  }
};

/**
 * Display Logged-in user profile..
 * @param profile
 */
People.prototype.showProfile = function (profile) {
  var _self = this;
  if (!_self.isUser()) {
    return false;
  }

  if (typeof profile === 'undefined') {
    _self.ajax('GET', this.url + '/remote/profile/', {}, function (data) {
      profile = data.responseText;
      renderProfile();
    });
  }
  else {
    renderProfile();
  }

  function renderProfile() {
    var user = _self.getUser();
    if (user) {
      profile = JSON.parse(profile);
      var opt = {};
      opt.id = 'ppl-profile-block';
      opt.body = profile.html || '';

      _self.showBlock(opt, _self.profileElement);
    }
  }
};

//::: 2 Step ::://

/**
 * Generate 2-step key.
 * @returns {string}
 */
People.prototype.generateKey = function() {
  var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32
  var key = '';
  for (var i = 0; i < 16; i++) key += s.charAt(Math.floor(Math.random() * s.length));
  return key;
};

/**
 * Show 2-step block.
 */
People.prototype.show2step = function () {
  var opt = {};
  opt.id = 'ppl-2step-block';
  opt.title = 'Enable two-step verification';

  var info = this.getInfo();
  this.key = this.generateKey();
  var qrWidth = 160;
  var qrHeight = 160;
  var qrUrl = 'otpauth://totp/' + encodeURIComponent(info.appName) + '?secret=' + this.key + '&issuer=People';

  opt.body = '';
  opt.body += '<p>Add an additional level of security to your account. <br>Whenever you log in, you\'ll be prompted to enter<br> a security code generated on your mobile device.</p>';
  opt.body += '<p>Open your two-step application and add your <br>account by scanning this QR code.</p>';
  opt.body += '<div id="ppl-qr-code">';
  opt.body += '<img src="https://chart.googleapis.com/chart?chs=' + qrWidth + 'x' + qrHeight + '&amp;cht=qr&amp;chl=' + qrUrl + '" alt="QR Code" width="' + qrWidth + '" height="' + qrHeight + '"/>';
  opt.body += '<code id="ppl-manual-code">' + this.key.match(/..../g).join(' ') + '</code>';
  opt.body += '</div>';
  opt.body += '<label>Enter the 6-digit code the application generates</label>';
  opt.body += '<input type="text" name="code" placeholder="123456">';
  opt.body += '<a id="ppl-2step-btn" class="submit" href="javascript:void(0)">Enable</a> ';

  this.showBlock(opt, document.body);
};

//::: Events ::://

/**
 * Register events.
 */
People.prototype.clickEvents = function () {
  var _self = this;
  document.addEventListener('click', function (e) {

    // Elements ID
    switch (e.target.id) {
      case 'ppl-login-btn':
        _self.ajax('POST', _self.url + '/remote/login/', {
          username: document.getElementById('ppl-login-name').value,
          password: document.getElementById('ppl-login-pass').value
        }, function (data) {
          if (!_self.errors(data)) {
            _self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-register-btn':
        _self.ajax('POST', _self.url + '/remote/register/', {
          username: document.getElementById('register-name').value,
          email: document.getElementById('ppl-register-email').value,
          password: document.getElementById('ppl-register-pass').value
        }, function (data) {
          if (!_self.errors(data)) {
            _self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-forgot-btn':
        _self.ajax('POST', _self.url + '/remote/forgot/', {
          email: document.getElementById('ppl-forgot-email').value
        }, function (data) {
          if (!_self.errors(data)) {
            _self.showLogin({form: 'reset'});
          }
        });
        break;

      case 'ppl-forgot-reset-btn':
        _self.ajax('POST', _self.url + '/remote/forgot/reset/', {
          token: document.getElementById('ppl-forgot-reset-token').value,
          password: document.getElementById('ppl-forgot-reset-pass').value
        }, function (data) {
          if (!_self.errors(data)) {
            _self.event.emit('passwordreset', data);
            _self.showLogin();
          }
        });
        break;

      case 'ppl-twostep-login-btn':
        _self.ajax('POST', _self.url + '/remote/twostep-login/', {
          code: document.getElementById('ppl-twostep-login-code').value
        }, function (data) {
          if (!_self.errors(data, 'Verified successfully')) {
            _self.event.emit('twostep', data);
            _self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-update-profile-btn':
        var elms = document.querySelectorAll('#ppl-profile-form input');
        var values = {fields: {}};
        for (var i = 0, elm; elm = elms[i]; ++i) {
          if (elm.name === 'username' || elm.name === 'email') {
            values[elm.name] = elm.value;
          }
          else {
            values.fields[elm.name] = elm.value;
          }
        }
        values.fields = JSON.stringify(values.fields);
        _self.ajax('POST', _self.url + '/remote/profile/', values, function (data) {
          if (!_self.errors(data)) {
            _self.event.emit('profileupdate', data);
            _self.showProfile(data.responseText);
          }
        });
        break;

      case 'ppl-update-password-btn':
        var elms = document.querySelectorAll('#ppl-new-password input');
        var values = {};
        for (var i = 0, elm; elm = elms[i]; ++i) {
          values[elm.name] = elm.value;
        }
        _self.ajax('POST', _self.url + '/remote/password/', values, function (data) {
          if (!_self.errors(data)) {
            _self.event.emit('passwordupdate', data);
            _self.showProfile(data.responseText);
          }
        });
        break;

      case 'ppl-2step-btn':
        var code = document.querySelector('#ppl-2step-block input');
        if (code.value.length !== 6) {
          return alert('A 6-digit code is required.');
        }
        var secret = document.querySelector('#ppl-manual-code');

        var values = {
          secret: secret.innerText.split(' ').join(''),
          code: code.value
        };
        _self.ajax('POST', _self.url + '/remote/2step/', values, function (data) {
          if (!_self.errors(data, '2-Step verification enabled.')) {
            _self.event.emit('twostepupdate', data);
            _self.hideBlock('ppl-2step-block');
          }
        });
        break;

      case 'ppl-user-avatar':
      case 'ppl-user-name':
        _self.showProfile();
        break;

      case 'ppl-user-logout':
        _self.logout();
        break;
    }

    // Elements Class
    var classes = e.target.classList;
    if (classes.contains('ppl-social-login')) {
      var name = e.target.id.replace('ppl-login-', '');
      WinChan.open({
          url: _self.url + '/remote/register/' + name + '/',
          relay_url: _self.relayUrl(),
          window_features: _self.windowFeatures()
        },
        function(err, r) {
          if (!err) {
            _self.login(r.data);
          }
        });
    }
    else if (classes.contains('ppl-to-login')) {
      _self.showLogin();
    }
    else if (classes.contains('ppl-to-register')) {
      _self.showLogin({form: 'register'});
    }
    else if (classes.contains('ppl-to-forgot')) {
      _self.showLogin({form: 'forgot'});
    }
    else if (classes.contains('ppl-verify-email')) {
      _self.ajax('POST', _self.url + '/remote/verify/', {}, function (data) {
        var message = 'A verification mail sent to your email address.';
        if (!_self.errors(data, message)) {
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
          url: _self.url + e.target.getAttribute('data-href'),
          relay_url: _self.relayUrl(),
          window_features: _self.windowFeatures()
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

      _self.ajax('GET', _self.url + url, {}, function (data) {
        if (!_self.errors(data, 'Disconnect successfully')) {
          e.target.classList.remove('ppl-disconnect-btn');
          e.target.classList.add('ppl-connect-btn');
          e.target.setAttribute('data-href', e.target.getAttribute('data-href').replace('/disconnect/', '/connect/'));
          e.target.innerHTML = e.target.innerHTML.replace('Disconnect', 'Connect');
        }
      });
    }
    else if (classes.contains('ppl-2step-click')) {
      if (e.target.checked) {
        e.target.checked = true;
        _self.show2step();
      }
      else {
        if (window.confirm("Do you really want to disable 2-Step Verification?")) {
          _self.ajax('POST', _self.url + '/remote/2step/', {secret: null}, function (data) {
            if (!_self.errors(data, '2-Step verification disabled.')) {
              _self.event.emit('twostepupdate', data);
            }
          });
        }
      }
    }
  }, false);
};