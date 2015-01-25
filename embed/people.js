(function($) {

  /**
   * Set Cookies.
   * @param cname
   * @param cvalue
   * @param exdays
   */
  function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
  }

  /**
   * Get Cookies.
   * @param cname
   * @returns {string}
   */
  function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1);
      if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
  }

  /**
   * Erase Cookie.
   * @param name
   */
  function eraseCookie(name) {
    setCookie(name,"",-1);
  }

  /**
   * After user login process.
   */
  function login(data) {
    if (data.success === true) {
      // Set cookies.
      setCookie('people.sid', data.sid, 14);

      // Save Shallow user to local storage.
      localStorage.setItem('people.user', JSON.stringify(data.user));

      // Hide the login/register forms.
      formsRemoveForms();

      // Show the logged-in user block.
      userBlock();
    }
    else {
      for (var key in data.errfor) {
        var errfor = key + ': ' + data.errfor[key] + '\n';
      }
      for (var i = 0; error = data.errors[i]; ++i) {
        var errors = error + '\n';
      }
      alert(errfor + errors);
    }
  }

  function Logout() {
    eraseCookie('people.sid');
    localStorage.removeItem('people.user');
    formsLoginBlock();
    userBlockRemove();
  }

  /**
   * Logged-in user block.
   */
  function userBlock() {
    var user = JSON.parse(localStorage.getItem('people.user'));
    if (user) {
      var userBlock = '';
      userBlock += '<div id="user-block">';
      userBlock += '<div id="user-gravatar"><img src="' + user.gravatar + '"></div>';
      userBlock += '<span id="user-name">' + user.username + '</span>';
      userBlock += '<span> | <a id="people-logout" href="javascript:void(0)">Log Out</a></span>';
      userBlock += '</div>';

      $('#people-dash').append(userBlock);
    }
  }

  function userBlockRemove() {
    $('#people-dash').html('');
  }

  /**
   * login/register block.
   */
  function formsLoginBlock() {
    var loginHTML = '';
    loginHTML += '<div id="people-login">';
    loginHTML += '<form class="login">';
    loginHTML += '<input id="login-name" type="textfield" placeholder="Name" value>';
    loginHTML += '<input id="login-pass" type="password" placeholder="Password" value>';
    loginHTML += '<button id="login-btn" type="button" name="button-login">Login</button>';
    loginHTML += '</form>';
    loginHTML += '<span>New here? <a class="to-register" href="javascript:void(0)">click to register</a></span>';
    loginHTML += '</div>';

    $('#people-forms').html(loginHTML);
  }

  function formsRegisterBlock() {
    var registerHTML = '';
    registerHTML += '<div id="people-register">';
    registerHTML += '<form class="register">';
    registerHTML += '<input id="register-name" type="textfield" placeholder="Name" value>';
    registerHTML += '<input id="register-email" type="text" placeholder="Email" value>';
    registerHTML += '<input id="register-pass" type="password" placeholder="Password" value>';
    registerHTML += '<button id="register-btn" type="button" name="button-register">Register</button>';
    registerHTML += '</form>';
    registerHTML += '<span>Already a member? <a class="to-login" href="javascript:void(0)">click to login</a></span>';
    registerHTML += '</div>';

    $('#people-forms').html(registerHTML);
  }

  /**
   * Hide login/register forms.
   */
  function formsRemoveForms() {
    $('#people-forms').html('');
  }

  ////////////////////////////////

  $(document).on('ready', function() {

    // login.
    $(document).on('click', '#login-btn', function() {
      var res = $.ajax({
        type: "POST",
        url: 'http://localhost:3000/login/remote/',
        dataType: 'json',
        data:  {
          username: $('#login-name').val(),
          password: $('#login-pass').val()
        }
      });

      res.done(function(data) {
        login(data);
      });
    });

    // Register.
    $(document).on('click', '#register-btn', function() {
      var res = $.ajax({
        type: "POST",
        url: 'http://localhost:3000/signup/remote/',
        dataType: 'json',
        data:  {
          username: $('#register-name').val(),
          email: $('#register-email').val(),
          password: $('#register-pass').val()
        }
      });

      res.done(function(data) {
        login(data);
      });
    });

    if (getCookie('people.sid')) {
      userBlock();
    }
    else {
      localStorage.removeItem('peolple.user');
      formsLoginBlock();
    }

    $(document).on('click', '.to-login', function() {
      formsLoginBlock();
    });

    $(document).on('click', '.to-register', function() {
      formsRegisterBlock();
    });

    $(document).on('click','#people-logout', function() {
      Logout();
    });
  });

})(jQuery);
