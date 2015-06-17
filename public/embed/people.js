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
  this.loginElementID = options.loginElementID || 'ppl-login';
  this.profileElementID = options.profileElementID || 'ppl-profile';
  this.userElementID = options.userElementID || 'ppl-user';

  this.event = new EventEmitter();

  if (localStorage.getItem('people.info') === null) {
    this.makeRequest('GET', this.url + '/remote/info/', {}, function (data) {
      var data = JSON.parse(data.responseText);
      if (data.success === true) {
        localStorage.setItem('people.info', JSON.stringify(data.info));
      }
    });
  }

  if (!this.getCookie('people.sid')) {
    localStorage.removeItem('people.user');
  }

  this.clickEvents();
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
            self.profileBlock(data.responseText);
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
            self.profileBlock(data.responseText);
          }
        });
        break;

      case 'ppl-user-avatar':
      case 'ppl-user-name':
        self.showProfile();
        break;
    }

    // Elements Class
    var classes = e.target.classList;
    if (classes.contains('ppl-social-login')) {
      var name = e.target.id.replace('ppl-login-', '');
      var url = self.url + '/remote/register/' + name + '/',
        width = 1000,
        height = 650,
        top = (window.outerHeight - height) / 2,
        left = (window.outerWidth - width) / 2;
      window.open(url, '', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);

      window.addEventListener('message', function(ev) {
        self.receiveMessage(ev, self, function() {
          this.login(ev.data);
        });
      }, false);
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
    else if (classes.contains('ppl-to-logout')) {
      self.logout();
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
      var url = e.target.getAttribute('data-href');

      var url = self.url + url,
        width = 1000,
        height = 650,
        top = (window.outerHeight - height) / 2,
        left = (window.outerWidth - width) / 2;
      window.open(url, '', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);

      window.addEventListener('message', function (ev) {
        self.receiveMessage(ev, self, function() {
          e.target.classList.remove('ppl-connect-btn');
          e.target.classList.add('ppl-disconnect-btn');
          e.target.setAttribute('data-href', e.target.getAttribute('data-href').replace('/connect/', '/disconnect/'));
          e.target.innerHTML = e.target.innerHTML.replace('Connect', 'Disconnect');
        });
      }, false);
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
  this.event.emit('login', data);
};

/**
 * Logout current user.
 */
People.prototype.logout = function () {
  this.eraseCookie('people.sid');
  localStorage.removeItem('people.user');
  this.event.emit('logout', data);
};

/**
 * Logged-in user block.
 */
People.prototype.showUser = function () {
  if (this.getCookie('people.sid')) {
    var user = JSON.parse(localStorage.getItem('people.user'));
    if (user) {
      var output = '';
      output += '<div class="ppl-block" id="ppl-user-block">';
      output += '<div><img id="ppl-user-avatar" src="' + user.avatar + '"></div>';
      output += '<span id="ppl-user-name">' + user.username + '</span>';
      output += '<span> | <a class="ppl-to-logout" href="javascript:void(0)">Log Out</a></span>';
      output += '</div>';

      var el = document.getElementById(this.userElementID);
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
  output += '<h3>Login</h3>';
  output += '<form class="ppl-login-form">';
  output += '<div class="ppl-form-field"><input id="ppl-login-name" type="textfield" placeholder="Name"></div>';
  output += '<div class="ppl-form-field"><input id="ppl-login-pass" type="password" placeholder="Password"></div>';
  output += '<button id="ppl-login-btn" type="button" name="button-login">Login</button> ';
  output += '<a class="ppl-to-forgot" href="javascript:void(0)">Forgot password</a>';
  output += '</form>';

  if (socials && socials.length > 0) {
    output += '<H4>Or login with: </H4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      output += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)"><i class="icon-' + name + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</a> ';
    }
  }

  output += '<div>New here? <a class="ppl-to-register" href="javascript:void(0)">Register</a></div>';
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
  output += '<button id="ppl-register-btn" type="button" name="button-register">Register</button>';
  output += '</form>';

  if (socials && socials.length > 0) {
    output += '<h4>Or Register with: </h4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      output += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)"><i class="icon-' + name + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</a>';
    }
  }

  output += '<div>Already a member? <a class="ppl-to-login" href="javascript:void(0)">Login</a></div>';
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
  output += '<button id="ppl-forgot-btn" type="button" name="button-forgot">Send to my mail</button>';
  output += '</form>';
  output += '<a class="ppl-to-login" href="javascript:void(0)">Back to login</a>';

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
  output += '<button id="ppl-forgot-reset-btn" type="button" name="button-forgot-reset">Update Password</button>';
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
People.prototype.showLogin = function (options) {
  if (!this.getCookie('people.sid')) {
    var form = options.form || 'login';
    var info = JSON.parse(localStorage.getItem('people.info'));
    var socials = info ? info.socials : [];
    var output = '';
    output += '<div class="ppl-block" id="ppl-login-block">';
    output += '<div class="ppl-close-btn">&times</div>';
    output += '<div class="ppl-alerts"></div>';
    switch (form) {
      case 'login':
        output += this.loginForm(socials);
        break;

      case 'register':
        output += this.registerForm(socials);
        break;

      case 'forgot':
        output += this.forgotForm();
        break;

      case 'reset':
        output += this.forgotResetForm();
        break;
    }
    output += '</div>';

    var el = document.getElementById(this.loginElementID);
    if (el) el.innerHTML = output;
  }
};

/**
 * Logged-in user profile.
 */
People.prototype.showProfile = function () {
  var self = this;
  var el = document.getElementById(this.profileElementID);
  if (el && this.getCookie('people.sid')) {
    this.makeRequest('GET', this.url + '/remote/profile/', {sid: this.getCookie('people.sid')}, function (data) {
      self.profileBlock(data.responseText);
    });
  }
};

/**
 * Display profile block.
 * @param data
 */
People.prototype.profileBlock = function (data) {
  if (this.getCookie('people.sid')) {
    var user = JSON.parse(localStorage.getItem('people.user'));
    if (user) {
      data = JSON.parse(data);
      var output = '';
      output += '<div class="ppl-block" id="ppl-profile-block">';
      output += '<div class="ppl-close-btn">&times</div>';
      output += '<div class="ppl-alerts"></div>';

      if (data && data.html) {
        output += data.html;
      }

      output += '</div>';
      var el = document.getElementById(this.profileElementID);
      if (el) el.innerHTML = output;
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

/**
 * Receive message from popup.
 * @param event
 */
People.prototype.receiveMessage = function (event, self, next) {
  //window.removeEventListener('message', receiveMessage, false);
  if (event.origin !== self.url) {
    return;
  }

  if (next) {
    return next();
  }
};
