var Cookies = require('js-cookie');

var User = {
  isUser: function() {
    var user = sessionStorage.getItem('people.user');
    var token = Cookies.get('people.token')
    if (token && user && user.iat < new Date().getTime()) {
      return user;
    }
    else {
      this.logout();
      return false;
    }
  },
  loguot: function() {
    sessionStorage.removeItem('people.user');
    Cookies.remove('people.token');
  }
};

module.exports = User;