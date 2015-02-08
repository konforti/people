'use strict';

var people = people || {};

(function() {
  people.baseUrl = 'http://localhost:3000';

  /**
   * Make AJAX request.
   * @param method
   * @param url
   * @param data
   * @param next
   * @returns {boolean}
   */
  people.makeRequest = function(method, url, data, next) {
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
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
      }
    }
    if (method == 'GET') {
      query = str.length > 0 ? '?' + str.join("&") : '';
    }
    else {
      body = str.join("&");

    }

    httpRequest.open(method, url + query, true);
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4 && httpRequest.status === 200) {
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
  people.setCookie = function(name, value, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + "; " + expires;
  };

  /**
   * Get Cookies.
   * @param cname
   * @returns {string}
   */
  people.getCookie = function(name) {
    var name = name + "=";
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
    return "";
  };

  /**
   * Erase Cookie.
   * @param name
   */
  people.eraseCookie = function(name) {
    people.setCookie(name, "", -1);
  };

  /**
   * Trigger on cookie set or change.
   * @param name
   * @param callback
   * @returns {*}
   */
  people.cookieRegistry = [];
  people.oncookieset = function(name, callback) {
    setTimeout(people.oncookieset, 100);
    if (people.cookieRegistry[name]) {
      if (people.getCookie(name) != people.cookieRegistry[name]) {
        people.cookieRegistry[name] = people.getCookie(name);
        return callback();
      }
    } else {
      people.cookieRegistry[name] = people.getCookie(name);
    }
  };

  /**
   * After user login process.
   */
  people.login = function(data) {
    if (data.success === true) {
      // Set cookies.
      people.setCookie('people.sid', data.sid, 14);

      // Save Shallow user to local storage.
      localStorage.setItem('people.user', JSON.stringify(data.user));

      // Show the logged-in user block.
      people.userBlock();
      people.userProfile();
      people.loginBlockRemove();
    }
    else {
      for (var key in data.errfor) {
        var errfor = key + ': ' + data.errfor[key] + '\n';
      }
      for (var i = 0, error; error = data.errors[i]; ++i) {
        var errors = error + '\n';
      }
      alert(errfor + errors);
    }
  };

  /**
   * Logout current user.
   */
  people.logout = function() {
    people.eraseCookie('people.sid');
    localStorage.removeItem('people.user');
    people.loginBlock();
    people.userBlockRemove();
    people.userProfileRemove();
  };

  /**
   * Logged-in user block.
   */
  people.userBlock = function() {
    if (people.getCookie('people.sid')) {
      var user = JSON.parse(localStorage.getItem('people.user'));
      if (user) {
        var userBlock = '';
        userBlock += '<div class="people-block" id="user-block">';
        userBlock += '<div id="user-avatar"><img src="' + user.avatar + '"></div>';
        userBlock += '<span id="user-name">' + user.username + '</span>';
        userBlock += '<span> | <a class="to-logout" href="javascript:void(0)">Log Out</a></span>';
        userBlock += '</div>';

        var el = document.getElementById("people-user");
        if (el) el.innerHTML = userBlock;
      }
    }
  };

  /**
   *
   */
  people.userBlockRemove = function() {
    var el = document.getElementById("people-user");
    if (el) el.innerHTML = '';
  };

  /**
   * login/register block.
   */
  people.loginForm = function(socials) {
    var loginHTML = '';
    loginHTML += '<form class="login">';
    loginHTML += '<div class="form-field"><input id="login-name" type="textfield" placeholder="Name" value></div>';
    loginHTML += '<div class="form-field"><input id="login-pass" type="password" placeholder="Password" value></div>';
    loginHTML += '<button id="login-btn" type="button" name="button-login">Login</button> ';
    loginHTML += '<a class="to-forgot" href="javascript:void(0)">Forgot my password</a>';
    loginHTML += '</form>';
    loginHTML += '<h4>Or login using: </h4>';
    for (var i = 0, name; name = socials[i]; ++i ) {
      loginHTML += '<a class="social-login" id="login-'+ name +'" href="javascript:void(0)">' + name.charAt(0).toUpperCase() + name.slice(1) + '</a> ';
    }
    loginHTML += '<div>New here? <a class="to-register" href="javascript:void(0)">Register</a></div>';

    return loginHTML;
  };

  people.registerForm = function(socials) {
    var registerHTML = '';
    registerHTML += '<form class="register">';
    registerHTML += '<div class="form-field"><input id="register-name" type="textfield" placeholder="Name" value></div>';
    registerHTML += '<div class="form-field"><input id="register-email" type="text" placeholder="Email" value></div>';
    registerHTML += '<div class="form-field"><input id="register-pass" type="password" placeholder="Password" value></div>';
    registerHTML += '<button id="register-btn" type="button" name="button-register">Register</button>';
    registerHTML += '</form>';
    registerHTML += '<h4>Or Login with: </h4>';
    for (var i = 0, name; name = socials[i]; ++i ) {
      registerHTML += '<a class="social-login" id="login-'+ name +'" href="javascript:void(0)">'+ name.charAt(0).toUpperCase() + name.slice(1) +'</a>';
    }
    registerHTML += '<div>Already a member? <a class="to-login" href="javascript:void(0)">Login</a></div>';

    return registerHTML;
  };

  people.forgotForm = function() {
    var forgotHTML = '';
    forgotHTML += '<form class="forgot">';
    forgotHTML += '<div class="form-field"><input id="forgot-email" type="text" placeholder="Email" value></div>';
    forgotHTML += '<button id="forgot-btn" type="button" name="button-forgot">Send to my mail</button>';
    forgotHTML += '</form>';
    forgotHTML += '<a class="to-login" href="javascript:void(0)">Back to login</a>';

    return forgotHTML;
  };

  people.forgotResetForm = function() {
    var forgotResetHTML = '';
    forgotResetHTML += '<form class="forgot-reset">';
    forgotResetHTML += '<div class="form-field"><input id="forgot-reset-token" type="text" placeholder="Verification Token"></div>';
    forgotResetHTML += '<div class="form-field"><input id="forgot-reset-pass" type="password" placeholder="New Password"></div>';
    forgotResetHTML += '<button id="forgot-reset-btn" type="button" name="button-forgot-reset">Update Password</button>';
    forgotResetHTML += '</form>';

    return forgotResetHTML;
  };

  /**
   *
   */
  people.loginBlockRemove = function() {
    var el = document.getElementById("people-login");
    if (el) el.innerHTML = '';
  };

  people.loginBlock = function(options) {
    if (!people.getCookie('people.sid')) {
      options = options || {};
      var form = options.form || 'login';
      var info = JSON.parse(localStorage.getItem('people.info'));
      var socials = info ? info.socials : [];
      var output = '<div class="people-block" id="people-login">';
      switch (form) {
        case 'login':
          output += people.loginForm(socials);
          break;

        case 'register':
          output += people.registerForm(socials);
          break;

        case 'forgot':
          output += people.forgotForm();
          break;

        case 'reset':
          output += people.forgotResetForm();
          break;
      }
      output += '</div>';

      var el = document.getElementById("people-login");
      if (el) el.innerHTML = output;
    }
  };

  /**
   * Logged-in user profile.
   */
  people.userProfile = function(data) {
    if (people.getCookie('people.sid')) {
      var user = JSON.parse(localStorage.getItem('people.user'));
      if (user) {
        var el = document.getElementById("people-profile");
        if (el) {
          if (data && data.html) {
            el.innerHTML = data.html;
          }
          else {
            people.makeRequest('GET', people.baseUrl + '/remote/profile/', {sid: people.getCookie('people.sid')}, function(data) {
              el.innerHTML = data.responseText;
            });
          }
        }
      }
    }
  };

  /**
   *
   */
  people.userProfileRemove = function() {
    var el = document.getElementById("people-profile");
    if (el) el.innerHTML = '';
  };

  /**
   * Receive message from popup.
   * @param event
   */
  people.receiveMessage = function(event) {
    //window.removeEventListener("message", receiveMessage, false);
    if (event.origin !== people.baseUrl) {
      return;
    }

    people.login(event.data);
  };

  /**
   * Events.
   */
  document.addEventListener("click", function(e) {

    // Elements ID
    switch (e.target.id) {

      case 'login-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/login/', {
          username: document.getElementById("login-name").value,
          password: document.getElementById("login-pass").value
        }, function(data) {
          people.login(JSON.parse(data.responseText));
        });
        break;

      case 'register-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/signup/', {
          username: document.getElementById("register-name").value,
          email:    document.getElementById("register-email").value,
          password: document.getElementById("register-pass").value
        }, function(data) {
          people.login(JSON.parse(data.responseText));
        });
        break;

      case 'forgot-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/forgot/', {
          email: document.getElementById("forgot-email").value
        }, function(data) {
          if (JSON.parse(data.responseText).success === true) {
            people.loginBlock({form: 'reset'});
          }
        });
        break;

      case 'forgot-reset-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/forgot/reset/', {
          token:    document.getElementById("forgot-reset-token").value,
          password: document.getElementById("forgot-reset-pass").value
        }, function(data) {
          if (JSON.parse(data.responseText).success === true) {
            people.loginBlock();
          }
        });
        break;

      case 'update-profile-btn':
        var elms = document.querySelectorAll('form#profile input');
        var values = {sid: people.getCookie('people.sid')};
        for (var i = 0, el; el = elms[i]; ++i ) {
          values[el.name] = el.value;
        }
        people.makeRequest('POST', people.baseUrl + '/remote/profile/', values, function(data) {
          data = JSON.parse(data.responseText);
          if (data.success === true) {
            people.userProfile(data);
          }
        });
        break;

      case 'update-password-btn':
        var elms = document.querySelectorAll('form#password input');
        var values = {sid: people.getCookie('people.sid')};
        for (var i = 0, el; el = elms[i]; ++i ) {
          values[el.name] = el.value;
        }
        people.makeRequest('POST', people.baseUrl + '/remote/password/', values, function(data) {
          data = JSON.parse(data.responseText);
          if (data.success === true) {
            people.userProfile(data);
          }
        });
        break;
    }

    // Elements Class
    switch (e.target.className) {

      case 'social-login':
        var name = e.target.id.replace('login-', '');

        var url = people.baseUrl + '/remote/signup/'+ name +'/',
          width = 1000,
          height = 650,
          top = (window.outerHeight - height) / 2,
          left = (window.outerWidth - width) / 2;
        window.open(url, '', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);

        window.addEventListener("message", people.receiveMessage, false);
        break;


      case 'to-login':
        people.loginBlock();
        break;

      case 'to-register':
        people.loginBlock({form: 'register'});
        break;

      case 'to-forgot':
        people.loginBlock({form: 'forgot'});
        break;

      case 'to-logout':
        people.logout();
        break;

      case 'verify-email':
        people.makeRequest('POST', people.baseUrl + '/remote/verification/', {}, function(data) {
          if (JSON.parse(data.responseText).success === true) {
            // Message.
          }
        });
        break;
    }
  });

  if (localStorage.getItem('people.info') === null) {
    people.makeRequest('GET', people.baseUrl + '/remote/info/', {}, function(data) {
      var res = JSON.parse(data.responseText);
      if (res.success === true) {
        localStorage.setItem('people.info', JSON.stringify(res.info));
      }
    });
  }

  if (!people.getCookie('people.sid')) {
    localStorage.removeItem('people.user');
  }
})();
