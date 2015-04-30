/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.User = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/users/'+ this.id +'/';
    }
  });

  app.Delete = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/';
    }
  });

  app.Identity = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      isActive: '',
      username: '',
      email: ''
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.Roles = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      roles: [],
      newRole: ''
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/roles/';
    },
    parse: function(response) {
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
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/password/';
    },
    parse: function(response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.Note = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      data: '',
      userCreated: {}
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/notes/'+ (this.isNew() ? '' : this.id +'/');
    },
    parse: function(response) {
      if (response.account) {
        app.mainView.model.set(response.account);
        delete response.account;
      }

      return response;
    }
  });

  app.NoteCollection = Backbone.Collection.extend({
    model: app.Note
  });

  app.Status = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      status: '',
      name: ''
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/status/'+ (this.isNew() ? '' : this.id +'/');
    },
    parse: function(response) {
      if (response.account) {
        app.mainView.model.set(response.account);
        delete response.account;
      }

      return response;
    }
  });

  app.StatusCollection = Backbone.Collection.extend({
    model: app.Status
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    initialize: function() {
      this.model = app.mainView.model;
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    }
  });

  app.IdentityView = Backbone.View.extend({
    el: '#identity',
    template: _.template( $('#tmpl-identity').html() ),
    events: {
      'click .btn-update': 'update'
    },
    initialize: function() {
      this.model = new app.Identity();
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
        var key = el.name;
        var val = el.value;
        toSave[key] = val;
      });
      this.$el.find('.form-role select').each(function(i, el) {
        var key = el.name;
        var val = el.value;
        toSave[key] = val;
      });
      this.model.save(toSave);
    }
  });

  app.RolesView = Backbone.View.extend({
    el: '#roles',
    template: _.template( $('#tmpl-roles').html() ),
    events: {
      'click .btn-add': 'add',
      'click .btn-delete': 'delete',
      'click .btn-save': 'saveRoles'
    },
    initialize: function() {
      this.model = new app.Roles();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        roles: app.mainView.model.get('roles')
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
    add: function() {
      var newRole = this.$el.find('[name="newRole"]').val();
      var newRoleName = this.$el.find('[name="newRole"] option:selected').text();
      if (!newRole) {
        alert('Please select a role.');
        return;
      }
      else {
        var alreadyAdded = false;
        _.each(this.model.get('roles'), function(role) {
          if (newRole === role._id) {
            alreadyAdded = true;
          }
        });

        if (alreadyAdded) {
          alert('That role already exists.');
          return;
        }
      }

      this.model.get('roles').push({ _id: newRole, name: newRoleName });

      var sorted = this.model.get('roles');
      sorted.sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase();
      });
      this.model.set('roles', sorted);

      this.render();
    },
    delete: function(event) {
      if (confirm('Are you sure?')) {
        var idx = this.$el.find('.btn-delete').index(event.currentTarget);
        this.model.get('roles').splice(idx, 1);
        this.render();
      }
    },
    saveRoles: function() {
      this.model.save();
    }
  });

  app.PasswordView = Backbone.View.extend({
    el: '#password',
    template: _.template( $('#tmpl-password').html() ),
    events: {
      'click .btn-password': 'password'
    },
    initialize: function() {
      this.model = new app.Password({ _id: app.mainView.model.id });
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    password: function() {
      this.model.save({
        newPassword: this.$el.find('[name="newPassword"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      });
    }
  });

  app.DeleteView = Backbone.View.extend({
    el: '#delete',
    template: _.template( $('#tmpl-delete').html() ),
    events: {
      'click .btn-delete': 'delete',
    },
    initialize: function() {
      this.model = new app.Delete({ _id: app.mainView.model.id });
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    },
    delete: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function(model, response) {
            if (response.success) {
              location.href = '/admin/users/';
            }
            else {
              app.deleteView.model.set(response);
            }
          }
        });
      }
    }
  });

  app.NewNoteView = Backbone.View.extend({
    el: '#notes-new',
    template: _.template( $('#tmpl-notes-new').html() ),
    events: {
      'click .btn-add': 'addNew'
    },
    initialize: function() {
      this.model = new app.Note();
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      this.$el.html( this.template(this.model.attributes) );
    },
    validates: function() {
      var errors = [];
      if (this.$el.find('[name="data"]').val() === '') {
        errors.push('Please enter some notes.');
      }

      if (errors.length > 0) {
        this.model.set({ errors: errors });
        return false;
      }

      return true;
    },
    addNew: function() {
      if (this.validates()) {
        this.model.save({
          data: this.$el.find('[name="data"]').val()
        });
      }
    }
  });

  app.NoteCollectionView = Backbone.View.extend({
    el: '#notes-collection',
    template: _.template( $('#tmpl-notes-collection').html() ),
    initialize: function() {
      this.collection = new app.NoteCollection();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.collection, 'reset', this.render);
      this.render();
    },
    syncUp: function() {
      this.collection.reset(app.mainView.model.get('notes'));
    },
    render: function() {
      this.$el.html(this.template());

      var frag = document.createDocumentFragment();
      var last = document.createTextNode('');
      frag.appendChild(last);
      this.collection.each(function(model) {
        var view = new app.NotesItemView({ model: model });
        var newEl = view.render().el;
        frag.insertBefore(newEl, last);
        last = newEl;
      }, this);
      $('#notes-items').append(frag);

      if (this.collection.length === 0) {
        $('#notes-items').append( $('#tmpl-notes-none').html() );
      }
    }
  });

  app.NotesItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'note',
    template: _.template( $('#tmpl-notes-item').html() ),
    render: function() {
      this.$el.html( this.template(this.model.attributes) );

      this.$el.find('.timeago').each(function(index, indexValue) {
        if (indexValue.innerText) {
          var myMoment = moment(indexValue.innerText);
          indexValue.innerText = myMoment.from();
        }
      });
      return this;
    }
  });

  app.NewStatusView = Backbone.View.extend({
    el: '#status-new',
    template: _.template( $('#tmpl-status-new').html() ),
    events: {
      'click .btn-add': 'addNew'
    },
    initialize: function() {
      this.model = new app.Status();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        id: app.mainView.model.get('status').id,
        name: app.mainView.model.get('status').name
      });
    },
    render: function() {
      this.$el.html( this.template(this.model.attributes) );

      if (app.mainView.model.get('status') && app.mainView.model.get('status').id) {
        this.$el.find('[name="status"]').val(app.mainView.model.get('status').id);
      }
    },
    validates: function() {
      var errors = [];
      if (this.$el.find('[name="status"]').val() === '') {
        errors.push('Please choose a status.');
      }

      if (this.$el.find('[name="status"]').val() === app.mainView.model.get('status').id) {
        errors.push('That is the current status.');
      }

      if (errors.length > 0) {
        this.model.set({ errors: errors });
        return false;
      }

      return true;
    },
    addNew: function() {
      if (this.validates()) {
        this.model.save({
          id: this.$el.find('[name="status"]').val(),
          name: this.$el.find('[name="status"] option:selected').text()
        });
      }
    }
  });

  app.StatusCollectionView = Backbone.View.extend({
    el: '#status-collection',
    template: _.template( $('#tmpl-status-collection').html() ),
    initialize: function() {
      this.collection = new app.StatusCollection();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.collection, 'reset', this.render);
      this.render();
    },
    syncUp: function() {
      this.collection.reset(app.mainView.model.get('statusLog'));
    },
    render: function() {
      this.$el.html( this.template() );

      var frag = document.createDocumentFragment();
      var last = document.createTextNode('');
      frag.appendChild(last);
      this.collection.each(function(model) {
        var view = new app.StatusItemView({ model: model });
        var newEl = view.render().el;
        frag.insertBefore(newEl, last);
        last = newEl;
      }, this);
      $('#status-items').append(frag);
    }
  });

  app.StatusItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'status',
    template: _.template( $('#tmpl-status-item').html() ),
    render: function() {
      this.$el.html( this.template(this.model.attributes) );

      this.$el.find('.timeago').each(function(index, indexValue) {
        if (indexValue.innerText) {
          var myMoment = moment(indexValue.innerText);
          indexValue.innerText = myMoment.from();
        }
      });
      return this;
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.User( JSON.parse( unescape($('#data-record').html())) );

      app.headerView = new app.HeaderView();
      app.identityView = new app.IdentityView();
      app.passwordView = new app.PasswordView();
      app.rolesView = new app.RolesView();
      app.newNoteView = new app.NewNoteView();
      app.notesCollectionView = new app.NoteCollectionView();
      app.newStatusView = new app.NewStatusView();
      app.statusCollectionView = new app.StatusCollectionView();
      app.deleteView = new app.DeleteView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
