/* global app:true */

(function () {
  'use strict';

  var app = app || {};

  app.Emails = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function () {
      return '/admin/emails';
    },
    parse: function (response) {
      if (response.emails) {
        app.mainView.model.set(response.emails);
        delete response.emails;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template($('#tmpl-header').html()),

    initialize: function () {
      this.model = app.mainView.model;
      //this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      this.$el.html(this.template(this.model.attributes));
    }
  });

  app.EmailsView = Backbone.View.extend({
    el: '#emails',
    template: _.template($('#tmpl-emails').html()),
    events: {
      'click .btn-update': 'update',
      'click .btn-test': 'test'
    },
    initialize: function () {
      this.model = new app.Emails();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function () {
      for (var key in app.mainView.model.attributes) {
        if (app.mainView.model.attributes.hasOwnProperty(key)) {
          this.model.set(key, app.mainView.model.get(key));
        }
      }
    },
    render: function () {
      this.$el.html(this.template(this.model.attributes));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="' + key + '"]').val(this.model.attributes[key]);
        }
      }

      app.editors = {};
      $('textarea.form-control').each(function(i, el) {
        app.editors[$(el).attr('name')] = CodeMirror.fromTextArea(el, {
          mode: 'gfm', // GitHub Flavored Markdown.
          lineNumbers: false,
          matchBrackets: true,
          lineWrapping: true,
          theme: 'default',
          extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
        });
      });
    },
    update: function () {
      var toSave = {};
      this.$el.find('.CodeMirror-code').each(function (i, el) {
        var key =  $(el).parents('.group').attr('id').replace('group-', '');
        toSave[key] = app.editors[key].getValue();
      });

      this.model.save(toSave);
    },

    test: function (ev) {
      var testId =  ev.target.id.replace('test-mail-', '');

      $.get('/admin/emails/test?id=' + testId, function(data) {
        if (data.success === true) {
          alert( "Test mail sent to " + data.email);
        }
        else {
          alert( "Error: " + data.err);
        }
      });
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function () {
      app.mainView = this;
      this.model = new app.Emails(JSON.parse(unescape($('#data-record').html())));

      app.headerView = new app.HeaderView();
      app.emailsView = new app.EmailsView();
    }
  });

  $(document).ready(function () {
    app.mainView = new app.MainView();
  });
}());
