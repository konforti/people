/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Settings = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/settings';
    },
    parse: function(response) {
      if (response.settings) {
        app.mainView.model.set(response.settings);
        delete response.settings;
      }

      return response;
    }
  });

  app.Keys = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      secretKey: ''
    },
    url: function() {
      return '/admin/settings/reset';
    },
    parse: function(response) {
      if (response.settings) {
        app.mainView.model.set(response.settings);
        delete response.settings;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),

    initialize: function() {
      this.model = app.mainView.model;
      //this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    }
  });

  app.SettingsView = Backbone.View.extend({
    el: '#settings',
    template: _.template( $('#tmpl-settings').html() ),
    events: {
      'click .btn-update': 'update',
      'click .btn-reset-secret': 'reset'
    },
    initialize: function() {
      this.model = new app.Settings();
      this.modelReset = new app.Keys();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.listenTo(this.modelReset, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      for (var key in app.mainView.model.attributes) {
        if (app.mainView.model.attributes.hasOwnProperty(key)) {
          this.model.set(key, app.mainView.model.get(key));
        }
      }

      this.modelReset.set('secretKey', app.mainView.model.get('secretKey'));
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }

      this.$el.find('[type="checkbox"]').each(function(i, el) {
        el.checked = (el.value === "1") ? true : false;
      });
    },
    update: function() {
      var toSave = {};
      this.$el.find('.form-role input').each(function(i, el) {
        if (el.type === "checkbox") {
          el.value = el.checked === true ? 1 : 0;
        }
        toSave[el.name] = el.value;

      });
      this.$el.find('.form-role select').each(function(i, el) {
        toSave[el.name] = el.value;
      });

      this.model.save(toSave);
    },

    reset: function() {
      if (window.confirm("Your current Secret Key will no long work after reset.\nyou will need to update any application configuration using the old secret because it will no longer work.\nContinue?")) {
        this.modelReset.save();
      }
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Settings( JSON.parse( unescape($('#data-record').html())) );

      app.headerView = new app.HeaderView();
      app.settingsView = new app.SettingsView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
