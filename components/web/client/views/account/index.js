/* global app:true */

(function () {
  'use strict';

  var app = app || {};

  app.Account = Backbone.Model.extend({
    idAttribute: '_id',
    url: function () {
      return '/account/';
    }
  });

  app.Delete = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function () {
      return '/account/';
    }
  });

  app.Identity = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      mode: '',
      username: '',
      email: ''
    },
    url: function () {
      return '/account/';
    },
    parse: function (response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.Password = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      newPassword: '',
      confirm: ''
    },
    url: function () {
      return '/account/password/';
    },
    parse: function (response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.TwoStep = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      appName: 'People App'
    },
    url: function () {
      return '/account/twostep/';
    },
    parse: function (response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template($('#tmpl-header').html()),
    initialize: function () {
      this.model = app.mainView.model;
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function () {
      this.$el.html(this.template(this.model.attributes));
    }
  });

  app.IdentityView = Backbone.View.extend({
    el: '#identity',
    template: _.template($('#tmpl-identity').html()),
    events: {
      'click .btn-update': 'update'
    },
    initialize: function () {
      this.model = new app.Identity();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function () {
      this.model.set({
        _id: app.mainView.model.id,
        mode: app.mainView.model.get('mode'),
        username: app.mainView.model.get('username'),
        email: app.mainView.model.get('email'),
        fields: app.mainView.model.get('fields')
      });
    },
    render: function () {
      this.$el.html(this.template(this.model.attributes));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="' + key + '"]').val(this.model.attributes[key]);
        }
      }
      for (var key in this.model.attributes.fields) {
        if (this.model.attributes.fields.hasOwnProperty(key)) {
          this.$el.find('[name="' + key + '"]').val(this.model.attributes.fields[key]);
        }
      }
    },
    update: function () {
      var toSave = {};
      toSave.fields = {};
      this.$el.find('.form-role input').each(function (i, el) {
        if (el.name === "email" || el.name === "username") {
          toSave[el.name] = el.value;
        }
        else {
          toSave.fields[el.name] = el.value;
        }
      });
      this.$el.find('.form-role select').each(function (i, el) {
        toSave[el.name] = el.value;
      });
      this.model.save(toSave);
    }
  });

  app.PasswordView = Backbone.View.extend({
    el: '#password',
    template: _.template($('#tmpl-password').html()),
    events: {
      'click .btn-password': 'password'
    },
    initialize: function () {
      this.model = new app.Password({_id: app.mainView.model.id});
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function () {
      this.$el.html(this.template(this.model.attributes));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="' + key + '"]').val(this.model.attributes[key]);
        }
      }
    },
    password: function () {
      this.model.save({
        newPassword: this.$el.find('[name="newPassword"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      });
    }
  });

  app.DeleteView = Backbone.View.extend({
    el: '#delete',
    template: _.template($('#tmpl-delete').html()),
    events: {
      'click .btn-delete': 'delete'
    },
    initialize: function () {
      this.model = new app.Delete({_id: app.mainView.model.id});
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function () {
      this.$el.html(this.template(this.model.attributes));
    },
    delete: function () {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function (model, response) {
            if (response.success) {
              location.href = '/account/';
            }
            else {
              app.deleteView.model.set(response);
            }
          }
        });
      }
    }
  });

  app.SessionsView = Backbone.View.extend({
    el: '#sessions',
    events: {
      'click .session-remove': 'sessionRemove'
    },
    sessionRemove: function (e) {
      this.row = e.target.getAttribute('data-id');
      Backbone.ajax({
        type: 'POST',
        url: '/account/session/remove/',
        data: {cid: this.row},
        success: function (data) {
          if (data.success === true) {
            $(e.target).parents('li').remove();
          }
        }
      });
    }
  });

  app.TwoStepView = Backbone.View.extend({
    el: '#2step',
    template: _.template($('#tmpl-twostep').html()),
    events: {
      'click .twostep-click': 'twostepClick',
      'click .btn-close': 'twostepClose',
      'click #twostep-submit': 'twostepSubmit'
    },
    initialize: function () {
      this.model = new app.TwoStep();
      this.syncUp();
    },
    syncUp: function () {
      this.model.set({
        _id: app.mainView.model.id,
        appName: app.mainView.model.get('appName')
      });
    },
    render: function () {
      var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32
      var key = '';
      for (var i = 0; i < 16; i++) {
        key += s.charAt(Math.floor(Math.random() * s.length));
      }
      var qrUrl = 'otpauth://totp/' + encodeURIComponent(this.model.appName) + '?secret=' + key + '&issuer=People'
      this.$el.append(this.template({key: key, qrUrl: qrUrl}));
      this.$el.find('#twostep-block').show();
    },
    twostepClick: function (e) {
      if (e.target.text === 'Enable') {
        this.render();
      }
      else {
        if (window.confirm("Do you really want to disable 2-Step Verification?")) {
          e.target.text = 'Enable';
          this.model.save({secret: null});
        }
      }
    },
    twostepClose: function(e) {
      this.$el.find('#twostep-block').hide();
    },
    twostepSubmit: function (e) {
      var code = document.querySelector('#twostep-block input');
      if (code.value.length !== 6) {
        return alert('A 6-digit code is required.');
      }
      var secret = document.querySelector('#manual-code');

      var values = {
        secret: secret.innerText.split(' ').join(''),
        code: code.value
      };
      this.model.save(values);
      $('#twostep-block').hide();
      $('.twostep-click').text('Disable');
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function () {
      app.mainView = this;
      this.model = new app.Account(JSON.parse(unescape($('#data-record').html())));

      app.headerView = new app.HeaderView();
      app.identityView = new app.IdentityView();
      app.passwordView = new app.PasswordView();
      app.deleteView = new app.DeleteView();
      app.sessionsView = new app.SessionsView();
      app.TwoStepView = new app.TwoStepView();
    }
  });

  $(document).ready(function () {
    app.mainView = new app.MainView();
  });
}());
