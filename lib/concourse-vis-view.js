'use babel';
var yaml = require('js-yaml');
var renderer = require('./concourse-render.js');
var _ = require('underscore');
var d3 = require('d3');

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

  update(value) {

    if (this.svg === undefined) { return; }

    try {
      var obj = yaml.safeLoad(value);
    }
    catch(e) {
      if (e.constructor.name == "YAMLException") {
        console.log(e);
        // this.element.innerHTML = value; // TODO : change to message saying not a YAML file (giphy image)
      }

      return;
    }

    // file is YAML, start render
    console.log(obj);

    var resources = obj.resources;
    var jobs = obj.jobs;

    // recurse each job
    _.each(jobs, function(job) {
      // does the job have an aggregate plan
      _.each(job.plan, function (plan) {

        job.finished_build = { status: "succeeded" };

        job.groups = [];

        if (plan.get !== undefined) {
          job.inputs = [{
            name: plan.get,
            resource: plan.get,
            trigger: plan.trigger !== undefined ? plan.trigger : false,
            passed: plan.passed !== undefined ? plan.passed : []
          }];
        }
        if (plan.put !== undefined) {
          job.outputs = [{name: plan.put, resource: plan.put }];
        }

        if (plan.aggregate !== undefined) {
          var outputs = [];
          var inputs = [];

          _.each(plan.aggregate, function (aggrPlan) {
            if (aggrPlan.get !== undefined) {
              inputs.push({
                name: aggrPlan.get,
                resource: aggrPlan.get,
                trigger: aggrPlan.trigger !== undefined ? aggrPlan.trigger : false,
                passed: aggrPlan.passed !== undefined ? aggrPlan.passed : []
              });
            }
            if (aggrPlan.put !== undefined) {
              outputs.push({name: aggrPlan.put, resource: aggrPlan.put });
            }
          });

          job.inputs = inputs;
          job.outputs = outputs;
        }
      });
    });

    renderer.draw(this.svg, {}, jobs, resources, "1.0")
    // this.element.innerHTML = value;
  }

  init() {
    this.element.innerHTML = "";
    this.svg = renderer.renderPipeline({});
  }

  getTitle() {
    return("Concourse Pipeline Preview");
  }

  getElement() {
    return this.element;
  }

}
