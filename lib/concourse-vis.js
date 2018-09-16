'use babel';
var url = require('url');
var _ = require('underscore');
var $ = require('jquery');

import ConcourseVisView from './concourse-vis-view';
import {
  CompositeDisposable
} from 'atom';

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
    this.concourseVisView.vis = this;
    this.activeEditor = atom.workspace.getActiveTextEditor();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'concourse-vis:toggle': () => this.toggle()
    }));

    var _self = this;

    atom.workspace.addOpener(function(uri) {
      ref = url.parse(uri), protocol = ref.protocol, host = ref.host, pathname = ref.pathname;
      if (protocol !== 'concourse-vis:') {
        return;
      }

      return (_self.concourseVisView);

    });

    this.linkJobsAndResource = function() {

      var _self = this;

      // add click for jobs and resources
      $('.node.job a').click(function(e) {
        var jobName = _.find(e.currentTarget.children, function(c) {
          return c.tagName == "text";
        }).innerHTML;
        var buffer = _self.activeEditor.getBuffer();
        var lines = buffer.getLines().slice(0);

        var jobsLine = _.findIndex(lines, function(line) {
          return (line.match(/jobs:/) !== null);
        });

        lines = lines.slice(jobsLine)

        var jobLine = _.findIndex(lines, function(line) {
          jobNameRe = new RegExp("name: " + jobName)
          return (line.match(jobNameRe) !== null);
        });

        var absLinePos = jobLine + jobsLine;
        _self.activeEditor.setCursorBufferPosition([absLinePos, 0]);
      });

      $('.node.input a, .node.output a, .node.constrained-input a').click(function(e) {
        var resourceName = _.find(e.currentTarget.children, function(c) {
          return c.tagName == "text";
        }).innerHTML;

        var buffer = _self.activeEditor.getBuffer();
        var lines = buffer.getLines().slice(0);

        var resourcesLine = _.findIndex(lines, function(line) {
          return (line.match(/resources:/) !== null);
        });

        lines = lines.slice(resourcesLine)

        var resourceLine = _.findIndex(lines, function(line) {
          resourceNameRe = new RegExp("name: " + resourceName)
          return (line.match(resourceNameRe) !== null);
        });

        var absLinePos = resourceLine + resourcesLine;
        _self.activeEditor.setCursorBufferPosition([absLinePos, 0]);
      });
      if (_self.updateHandler !== undefined) _self.updateHandler.dispose();
      _self.updateHandler = _self.activeEditor.onDidStopChanging(function(changes) {
        var cViews = _.select(atom.workspace.getPanes(), function(p) {
          return isConcourseVisView(p.activeItem);
        })
        if (cViews.length > 0) _self.updateView();
      });

    }

    atom.workspace.observeActivePaneItem(function(item) {

      if (item === undefined) return;
      if (item.constructor.name == "TextEditor") {

        _self.activeEditor = item;
        _self.updateView();
        _self.concourseVisView.resetZoom();
        // _self.linkJobsAndResource();
      }
    });

  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.concourseVisView.destroy();
  },

  serialize() {
    return {
      concourseVisViewState: this.concourseVisView.serialize()
    };
  },

  toggle() {
    var _self = this;
    var cViews = _.select(atom.workspace.getPanes(), function(p) {
      return isConcourseVisView(p.activeItem);
    })
    if (cViews.length > 0) {
      _.each(cViews, function(v) {
        v.destroyItem(v.activeItem);
      });

      if (_self.updateHandler !== undefined) _self.updateHandler.dispose();
      return;
    }

    uri = "concourse-vis://";
    options = {};
    options.split = 'down';
    atom.workspace.open(uri, options).then(function() {
      _self.concourseVisView.init();
      _self.updateView();
      _self.linkJobsAndResource();

    }, function() {

    });
  },

  updateView() {
    var content = this.activeEditor.getText();
    this.concourseVisView.update(content);
  }

};
