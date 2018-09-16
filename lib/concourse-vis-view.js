'use babel';

var yaml = require('js-yaml');
var renderer = require('./render.js');
var d3 = require('d3');
var _ = require('underscore');

export default class ConcourseVisView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.id = "pipeline";
    this.element.classList.add('concourse-vis');

  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  init() {
    this.element.innerHTML = "";
    this.addLogoHeader();
    d3.select("#pipeline")
      .append("svg")
      .attr("class", "pipeline-graph test")
      .attr("width", "100%")
      .attr("height", "100%");

    var foundSvg = d3.select("svg.pipeline-graph");
    this.svg = renderer.createPipelineSvg(foundSvg);

  }

  addLogoHeader() {
    d3.select("#pipeline")
      .append("div")
      .attr("class", "topbar-logo")
      .html('<a class="logo-image-link" href="#"></a>');
  }

  getTitle() {
    return ("Concourse Pipeline Preview");
  }

  getElement() {
    return this.element;
  }

  iteratePlan(obj, id, parent, plan, inputs, outputs) {

    for (var property in obj) {
      if (property == "get") {

        if (parent == null) {
          inputs.push({
            name: obj[property],
            resource: obj[property],
            trigger: obj.trigger ? obj.trigger : false,
            passed: null
          });

        } else {

          inputs.push({
            name: obj[property],
            resource: parent[id].resource ? parent[id].resource : obj[property],
            trigger: parent[id].trigger ? parent[id].trigger : false,
            passed: parent[id].passed ? parent[id].passed : null
          });
        }
      }
      if (property == "put") outputs.push({
        name: obj[property],
        resource: obj[property]
      });
      if (typeof(obj[property]) == "object") {
        this.iteratePlan(obj[property], property, obj, plan, inputs, outputs);
      }
    }

    return [inputs, outputs];
  }

  resetZoom() {
      renderer.ResetPipelineFocus();
  }

  update(value) {

    if (this.svg === undefined) {
      return;
    }

    try {
      var obj = yaml.safeLoad(value);
      if (!obj) return;
    } catch (e) {
      if (e.constructor.name == "YAMLException") {
        console.log("Not a YAML file!");
        // this.element.innerHTML = value; // TODO : change to message saying not a YAML file (giphy image)
      }

      this.svg.html("");

      return;
    }

    // file is YAML, start render
    var resources = obj.resources;
    var jobs = obj.jobs;

    _self = this;

    try {
    // recurse each job
    _.each(jobs, function(job) {
      // does the job have an aggregate plan

      var inputs = [];
      var outputs = [];

      _.each(job.plan, function(plan) {

        job.finished_build = {
          status: "succeeded"
        };

        job.groups = [];

        inout = _self.iteratePlan(plan, null, null, plan, inputs, outputs);
      });

      job.inputs = inout[0];
      job.outputs = inout[1];
    });

    renderer.draw(this.svg, jobs, resources, "");
    } catch(e) {
       console.log("error: " + e.name + " - " + e.message);
    }

    this.vis.linkJobsAndResource();
  }
}
