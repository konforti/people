'use strict';

/**
 * Constructor.
 * @param options
 */
var People = function(options) {
  options = options || {};
  this.url = options.url || 'http://localhost:3000';
  this.loginID = options.loginID || 'ppl-login';
  this.profileID = options.profileID || 'ppl-profile';
  this.userBlockID = options.userBlockID || 'ppl-user';

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

  this.setEvents();
};

/**
 * Register events.
 */
People.prototype.setEvents = function () {
  var self = this;
  document.addEventListener('click', function (e) {

    // Elements ID
    switch (e.target.id) {
      case 'ppl-login-btn':
        self.makeRequest('POST', self.url + '/remote/login/', {
          username: document.getElementById('ppl-login-name').value,
          password: document.getElementById('ppl-login-pass').value
        }, function (data) {
          if (!self.alert(data)) {
            self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-register-btn':
        self.makeRequest('POST', self.url + '/remote/signup/', {
          username: document.getElementById('register-name').value,
          email: document.getElementById('ppl-register-email').value,
          password: document.getElementById('ppl-register-pass').value
        }, function (data) {
          if (!self.alert(data)) {
            self.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-forgot-btn':
        self.makeRequest('POST', self.url + '/remote/forgot/', {
          email: document.getElementById('ppl-forgot-email').value
        }, function (data) {
          if (!self.alert(data)) {
            self.loginBlock({form: 'reset'});
          }
        });
        break;

      case 'ppl-forgot-reset-btn':
        self.makeRequest('POST', self.url + '/remote/forgot/reset/', {
          token: document.getElementById('ppl-forgot-reset-token').value,
          password: document.getElementById('ppl-forgot-reset-pass').value
        }, function (data) {
          if (!self.alert(data)) {
            var event = new Event('onpasswordreset');
            document.dispatchEvent(event);
            self.loginBlock();
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
          if (!self.alert(data)) {
            var event = new Event('onprofileupdate');
            document.dispatchEvent(event);
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
          if (!self.alert(data)) {
            var event = new Event('onpasswordupdate');
            document.dispatchEvent(event);
            self.profileBlock(data.responseText);
          }
        });
        break;

      case 'ppl-user-avatar':
      case 'ppl-user-name':
        self.userProfile();
        break;
    }

    // Elements Class
    switch (e.target.className) {
      case 'ppl-social-login':
        var name = e.target.id.replace('ppl-login-', '');
        var url = self.url + '/remote/signup/' + name + '/',
          width = 1000,
          height = 650,
          top = (window.outerHeight - height) / 2,
          left = (window.outerWidth - width) / 2;
        window.open(url, '', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);

        window.addEventListener('message', function(e) {
          self.receiveMessage(e, self)
        }, false);
        break;

      case 'ppl-to-login':
        self.loginBlock();
        break;

      case 'ppl-to-register':
        self.loginBlock({form: 'register'});
        break;

      case 'ppl-to-forgot':
        self.loginBlock({form: 'forgot'});
        break;

      case 'ppl-to-logout':
        self.logout();
        break;

      case 'ppl-verify-email':
        self.makeRequest('POST', self.url + '/remote/verification/', {}, function (data) {
          var message = 'A verification mail sent to your email address.';
          if (!self.alert(data, message)) {
            // Wait.
          }
        });
        break;

      case 'ppl-close-btn':
        var parent = e.target.parentNode;
        if (parent) parent.outerHTML = '';
        break;

      case 'ppl-change-password':
        var el = document.getElementById('ppl-new-password');
        if (el) el.classList.toggle('hidden');
        break;
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
      throb.parentNode.removeChild(throb);
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
People.prototype.alert = function(data, info) {
  info = info || '';
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
      el.innerHTML += '<p>' + info + '</p>'
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

  var event = new Event('onlogin');
  document.dispatchEvent(event);

  // Show the logged-in user block.
  this.userBlock();
  this.userProfile();
  this.loginBlockRemove();
};

/**
 * Logout current user.
 */
People.prototype.logout = function () {
  this.eraseCookie('people.sid');
  localStorage.removeItem('people.user');

  var event = new Event('onlogout');
  document.dispatchEvent(event);

  this.loginBlock();
  this.userBlockRemove();
  this.userProfileRemove();
};

/**
 * Logged-in user block.
 */
People.prototype.userBlock = function () {
  if (this.getCookie('people.sid')) {
    var user = JSON.parse(localStorage.getItem('people.user'));
    if (user) {
      var userBlock = '';
      userBlock += '<div class="ppl-block" id="ppl-user-block">';
      userBlock += '<div><img id="ppl-user-avatar" src="' + user.avatar + '"></div>';
      userBlock += '<span id="ppl-user-name">' + user.username + '</span>';
      userBlock += '<span> | <a class="ppl-to-logout" href="javascript:void(0)">Log Out</a></span>';
      userBlock += '</div>';

      var el = document.getElementById(this.userBlockID);
      if (el) el.innerHTML = userBlock;
    }
  }
};

/**
 * Remove user block.
 */
People.prototype.userBlockRemove = function () {
  var el = document.getElementById('ppl-user-block');
  if (el) el.outerHTML = '';
};

/**
 * login/register block.
 */
People.prototype.loginForm = function (socials) {
  var loginHTML = '';
  loginHTML += '<h3>Login</h3>';
  loginHTML += '<form class="ppl-login-form">';
  loginHTML += '<div class="ppl-form-field"><input id="ppl-login-name" type="textfield" placeholder="Name"></div>';
  loginHTML += '<div class="ppl-form-field"><input id="ppl-login-pass" type="password" placeholder="Password"></div>';
  loginHTML += '<button id="ppl-login-btn" type="button" name="button-login">Login</button> ';
  loginHTML += '<a class="ppl-to-forgot" href="javascript:void(0)">Forgot password</a>';
  loginHTML += '</form>';
  if (socials && socials.length > 1) {
    loginHTML += '<div>Or login with: </div>';
    for (var i = 0, name; name = socials[i]; ++i) {
      loginHTML += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)">' + name.charAt(0).toUpperCase() + name.slice(1) + '</a> ';
    }
  }

  loginHTML += '<div>New here? <a class="ppl-to-register" href="javascript:void(0)">Register</a></div>';
  return loginHTML;
};

/**
 * Register form.
 * @param socials
 * @returns {string}
 */
People.prototype.registerForm = function (socials) {
  var registerHTML = '';
  registerHTML += '<h3>Register</h3>';
  registerHTML += '<form class="ppl-register-form">';
  registerHTML += '<div class="ppl-form-field"><input id="ppl-register-name" type="textfield" placeholder="Name"></div>';
  registerHTML += '<div class="ppl-form-field"><input id="ppl-register-email" type="text" placeholder="Email"></div>';
  registerHTML += '<div class="ppl-form-field"><input id="ppl-register-pass" type="password" placeholder="Password"></div>';
  registerHTML += '<button id="ppl-register-btn" type="button" name="button-register">Register</button>';
  registerHTML += '</form>';
  registerHTML += '<h4>Or Register with: </h4>';
  for (var i = 0, name; name = socials[i]; ++i) {
    registerHTML += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)">' + name.charAt(0).toUpperCase() + name.slice(1) + '</a>';
  }
  registerHTML += '<div>Already a member? <a class="ppl-to-login" href="javascript:void(0)">Login</a></div>';
  return registerHTML;
};

/**
 * Forgot password form.
 * @returns {string}
 */
People.prototype.forgotForm = function () {
  var forgotHTML = '';
  forgotHTML += '<h3>Forgot Password</h3>'
  forgotHTML += '<form class="ppl-forgot-form">';
  forgotHTML += '<div class="ppl-form-field"><input id="ppl-forgot-email" type="email" placeholder="Email"></div>';
  forgotHTML += '<button id="ppl-forgot-btn" type="button" name="button-forgot">Send to my mail</button>';
  forgotHTML += '</form>';
  forgotHTML += '<a class="ppl-to-login" href="javascript:void(0)">Back to login</a>';

  return forgotHTML;
};

/**
 * Reset forgot password form.
 * @returns {string}
 */
People.prototype.forgotResetForm = function () {
  var forgotResetHTML = '';
  forgotResetHTML += '<h3>Reset password</h3>';
  forgotResetHTML += '<form class="ppl-forgot-reset-form">';
  forgotResetHTML += '<div class="ppl-form-field"><textarea id="ppl-forgot-reset-token" placeholder="Verification Token"></textarea></div>';
  forgotResetHTML += '<div class="ppl-form-field"><input id="ppl-forgot-reset-pass" type="password" placeholder="New Password"></div>';
  forgotResetHTML += '<button id="ppl-forgot-reset-btn" type="button" name="button-forgot-reset">Update Password</button>';
  forgotResetHTML += '</form>';

  return forgotResetHTML;
};

/**
 * Remove login block.
 */
People.prototype.loginBlockRemove = function () {
  var el = document.getElementById('ppl-login-block');
  if (el) el.outerHTML = '';
};

/**
 * Display login block.
 * @param options
 */
People.prototype.loginBlock = function (options) {
  if (!this.getCookie('people.sid')) {
    options = options || {};
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

    var el = document.getElementById(this.loginID);
    if (el) el.innerHTML = output;
  }
};

/**
 * Logged-in user profile.
 */
People.prototype.userProfile = function () {
  var self = this;
  var el = document.getElementById(this.profileID);
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
      var el = document.getElementById(this.profileID);
      if (el) el.innerHTML = output;
    }
  }
};

/**
 * Remove profile block.
 */
People.prototype.userProfileRemove = function () {
  var el = document.getElementById('ppl-profile-block');
  if (el) el.outerHTML = '';
};

/**
 * Receive message from popup.
 * @param event
 */
People.prototype.receiveMessage = function (event, self) {
  //window.removeEventListener('message', receiveMessage, false);
  if (event.origin !== self.url) {
    return;
  }

  this.login(event.data);
};
