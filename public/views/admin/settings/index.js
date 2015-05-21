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
      'click .btn-update': 'update'
    },
    initialize: function() {
      this.model = new app.Settings();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        isActive: app.mainView.model.get('isActive'),
        username: app.mainView.model.get('username'),
        email: app.mainView.model.get('email')
      });
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      var toSave = {};
      this.$el.find('.form-role input').each(function(i, el) {
        var key = el.key;
        var val = el.value;
        toSave[key] = val;
      });
      this.$el.find('.form-role select').each(function(i, el) {
        var key = el.key;
        var val = el.value;
        toSave[key] = val;
      });
      this.model.save(toSave);
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = JSON.parse( unescape($('#data-record').html()) );

      app.headerView = new app.HeaderView();
      app.settingsView = new app.SettingsView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
