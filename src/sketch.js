/**
 * @fileoverview Sketch class for use with the Biolab activity suite.
 * @copyright Carnegie Mellon University 2019
 * @author mouse@cmu.edu (Meg Richards)
 */

import '@cmu-eberly-center/p5/lib/addons/p5.dom.js';
import 'p5.play';
import Beaker from 'p5.beaker/beaker.js';
import ConjugateBase from 'p5.beaker/conjugate_base.js';
import Proton from 'p5.beaker/proton.js';

const numInitialProtons = 10;
export const numConjugateBases = 10;
export let numProtons = 0;
export let numAcids = 0;

var particleTableUpdate = function(pNumAcids,pNumConjugateBases) {
    pNumAcids.html(numAcids);
    pNumConjugateBases.html(numConjugateBases-numAcids);
}

var particleTableColumn = function(p,table,column_data) {
    const images = column_data["images"];
    const image_div = p.createDiv().class("particle");
    if (images) {
        images.forEach((image) => {
            image_div.child(image);
        });
    }
    const label = column_data["label"];
    const data = column_data["data"];
    const column = p.createDiv();
    column.
        child(image_div).
        child(p.createP(label).class("label")).
        child(data);
    table.child(column);
}

var particleTableSetup = function(p,pNumAcids,pNumConjugateBases) {
    var table = p.createDiv().id("particle-table")

    // Acid column
    const acid_column_data = {};
    acid_column_data["images"] = [
        p.createImg(ConjugateBase.prototype.
                    image_path,'Conjugate Base').class("base"),
        p.createImg(Proton.prototype.
                    image_path,'Proton').class("proton")
    ];
    acid_column_data["label"] = "acid";
    acid_column_data["data"] = pNumAcids;
    particleTableColumn(p,table,acid_column_data);

    // Comparison column
    const comparison_column_data = {};
    comparison_column_data["label"] = "&lt;=&gt;"
    particleTableColumn(p,table,comparison_column_data);

    // Conjugate base column
    const conjugate_base_column_data = {};
    conjugate_base_column_data["images"] = [
        p.createImg(ConjugateBase.
                    prototype.image_path,
                    'Conjugate Base')
    ];
    conjugate_base_column_data["label"] = "conjugate base";
    conjugate_base_column_data["data"] = pNumConjugateBases;
    particleTableColumn(p,table,conjugate_base_column_data);

};

var updateNumProtons = function(beaker,newNumProtons) {
    var deltaProtons = newNumProtons - numProtons;
    if (deltaProtons > 0) {
        beaker.addParticles(Proton,deltaProtons);
    }
    else if (deltaProtons < 0) {
        beaker.removeParticles(Proton,Math.abs(deltaProtons));
    }
};

var inputNumProtonsSetup = function(beaker,sliderNumProtons) {
    /** @this p5.Element */
    var inputNumProtonsEvent = function() {
        var newNumProtons = parseInt(this.value(),10);
        if (newNumProtons===newNumProtons) { // Only if not NaN
            updateNumProtons(beaker,newNumProtons);
        }
    };
    sliderNumProtons.changed(inputNumProtonsEvent);
}

var inputPHUpdate = function(inputPH) {
    var pH = -7.0*(parseFloat(numProtons)-64.0)/32.0;
    inputPH.value(Number((pH).toFixed(2)));
}

var inputPHSetup = function(beaker,inputPH) {
    /** @this p5.Element */
    var inputPHEvent = function() {
        var newPH = parseFloat(this.value());
        if (newPH===newPH) { // Only if not NaN
            var newNumProtons =
                parseInt((32.0/-7.0)*newPH+64.0,10);
            updateNumProtons(beaker,newNumProtons);
        }
    };
    inputPH.input(inputPHEvent);
    inputPHUpdate(inputPH);
}

// Register callbacks to update UI
var registerUICallbacks = function(sliderNumProtons,inputPH,
                                   pNumAcids,pNumConjugateBases) {
    Proton.prototype.register_callback("Proton","post",
                          () => {
                              numProtons+=1;
                              inputPHUpdate(inputPH);
                              sliderNumProtons.value(numProtons);
                          });
    Proton.prototype.register_callback("remove","post",
                          () => {
                              numProtons-=1;
                              inputPHUpdate(inputPH);
                              sliderNumProtons.value(numProtons);
                          });

    ConjugateBase.prototype.register_callback("release_proton","pre",
                          () => {
                              numAcids-=1;
                              particleTableUpdate(pNumAcids,
                                                  pNumConjugateBases);
                              inputPHUpdate(inputPH);
                          });
    ConjugateBase.prototype.register_callback("reacts_with_proton","post",
                          () => {
                              numAcids+=1;
                              particleTableUpdate(pNumAcids,pNumConjugateBases);
                              inputPHUpdate(inputPH);
                          });
}

var UISetup = function(p,beaker) {
    p.createP('H(pH)').id("hph-label");
    p.createP('high').id("high-label");
    p.createP('low').id("low-label");

    var pNumConjugateBases = p.createP(numConjugateBases).
        id("num-conjugate-bases");
    var pNumAcids = p.createP(numAcids).id("num-acids");
    particleTableSetup(p,pNumAcids,pNumConjugateBases);

    var sliderNumProtons = p.createSlider(0,64,numInitialProtons).
        id('num-protons');
    inputNumProtonsSetup(beaker,sliderNumProtons);

    var inputPH = p.createInput('0').id('ph');
    inputPHSetup(beaker,inputPH);

    registerUICallbacks(sliderNumProtons,inputPH,pNumAcids,pNumConjugateBases);
}

/**
 * A Biolab sketch
 * @class Sketch
 */
export default function Sketch(p) {
    let beaker = null;

    p.preload = function() {
        Beaker.prototype.preload(p);
        ConjugateBase.prototype.preload(p);
        Proton.prototype.preload(p);
    }

    p.setup = function() {
        p.createCanvas(500,500);
        p.background(255,255,255);

        beaker = new Beaker(p,286,278,0,40,38,75);

        UISetup(p,beaker);

        beaker.addParticles(ConjugateBase,numConjugateBases);
        beaker.addParticles(Proton,numInitialProtons);
    };

    p.draw = function() {
        beaker.step();
        beaker.draw();
    };
}
