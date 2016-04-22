'use babel';
var url = require('url');
var _ = require('underscore');

import ConcourseVisView from './concourse-vis-view';
import { CompositeDisposable } from 'atom';

var isConcourseVisView = function(object) {
  if (isConcourseVisView == null) {
    isConcourseVisView = require('./concourse-vis-view');
  }
  return object instanceof ConcourseVisView;
};

export default {

  concourseVisView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.concourseVisView = new ConcourseVisView(state.concourseVisViewState);
    this.activeEditor = atom.workspace.getActiveTextEditor();

    var _self = this;

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'concourse-vis:toggle': () => this.toggle()
    }));

    atom.workspace.addOpener(function(uri) {
      ref = url.parse(uri), protocol = ref.protocol, host = ref.host, pathname = ref.pathname;
      if (protocol !== 'concourse-vis:') {
        return;
      }

      return(_self.concourseVisView);

    });

    atom.workspace.observeActivePaneItem(function(item) {
      if (item === undefined) return;
      if (item.constructor.name == "TextEditor") {
        if (_self.updateHandler !== undefined) _self.updateHandler.dispose();
        _self.activeEditor = item;
        _self.updateView();

        _self.updateHandler = _self.activeEditor.onDidStopChanging(function(changes) {
          _self.updateView();
        });
      }
    });
  },

  deactivate() {
    this.subscriptions.dispose();
    this.concourseVisView.destroy();
  },

  serialize() {
    return {
      concourseVisViewState: this.concourseVisView.serialize()
    };
  },

  toggle() {
    var cViews = _.select(atom.workspace.getPanes(), function(p) { return isConcourseVisView(p.activeItem); })
    if (cViews.length > 0) {
      _.each(cViews, function(v) {
          v.destroyItem(v.activeItem);
        });
        return;
    }
    var _self = this;

    uri = "concourse-vis://";
    options = {};
    options.split = 'down';
    atom.workspace.open(uri, options).then(function() {
      // _self.activeEditor = atom.workspace.getActiveTextEditor();
      _self.concourseVisView.init();
      _self.updateView();
    }, function() {

    });
  },

  updateView() {
    var content = this.activeEditor.getText();
    this.concourseVisView.update(content);
  }

};
