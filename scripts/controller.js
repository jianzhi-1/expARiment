
const Materials = require('Materials');
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Diagnostics = require('Diagnostics');
const Reactive = require('Reactive');
const Time=require('Time');
const Shaders=require('Shaders');
const NativeUI = require('NativeUI');
const Textures = require('Textures');

const burette=Scene.root.find('Burette');
const flask=Scene.root.find('Conical Flask');
const emitter=Scene.root.find('emitter0');
const solution = Scene.root.find('Solution');
const burettechem = Scene.root.find('BuretteChem');
const buretteProperties=Scene.root.find('Burette Properties');
const flaskProperties=Scene.root.find('Flask Properties');
const chemicalDisplay=Scene.root.find('Chemical Display');
const volumeDisplay=Scene.root.find('Volume Display');
const pHDisplay = Scene.root.find('pH Display');

//burettechem is the chemical in the burette

//solution is the chemical in the conical flask
const solutionProperties = Scene.root.find('Solution Properties');

//Solution emitter is the particle emitter in the solution which emits out
//the colour of the indicator in the conical flask
//const solutionemitter = Scene.root.find('solutionemitter');

const flaskTransform = flask.transform;
const buretteTransform = burette.transform;
const solutionTransform = solution.transform;
const buretteChemTransform = burettechem.transform;

//Whether the chemicals in burette and conical flasks are in place
var set1=true;
var set2=true;

//maxVolume: maximum volume in the burette
//currentVolume: current volume in the burette
const maxVolume = 50;
const solutionInitialVolume = 1;
var currentVolume=50;

//longPress: true if the burette is still running due to a longPress
var longPress = false;
var longPressInterval;

//which chemical is moving. 1 for chem1, 2 for chem2
var moving = -1;

var movementChem1;
var movementChem2;

//variables for determining the correct titre value
var correctTitreValue = 25.0;
var closeRange=1.0;
var farRange=5.0;
var overdoseColor = "purple";
var correctColor = "pink";

var pKaValues = [7.0, -4.0, 4.76, 9.25, 13.8];
var pKbValues = [7.0, 18.0, 9.24, 4.75, 0.2];
var pKValues = [7.0, -4.0, 4.76, 4.75, 0.2];
var nValues = [0, 1, 2, 1, 1]; //determines whether its a monobasic/dibasic acid, and similarly for base
var solutionType = ['water', 'acid', 'acid', 'base', 'base'];
var solutionName = ['None', 'HCl', 'H2SO4', 'NH3', 'NaOH'];
var indicatorName = ['None', 'Methyl Orange', 'Screened Methyl Orange'];
var x1 = 0, y1 = 0;
var movingFlask = false;
var movingBurette = false;

function toNumberString(num){
  var cur = num.toString();
  if (num-Math.floor(num)==0){
    return cur + ".0";
  }
  else {
    return cur;
  }
}



const mhcl = Materials.get('HCl');
const mh2so4 = Materials.get('H2SO4');
const mnh3 = Materials.get('NH3');
const mnaoh = Materials.get('NaOH');
const matt = [mhcl, mh2so4, mnh3, mnaoh];




var currentSelection = 'Main Menu';
var buretteSelection = 0;
var flaskSelection = 0;
var indicatorSelection = 0;

Promise.all([

    // Loading Textures for the buttons
    Textures.findFirst('None'),
    Textures.findFirst('BuretteButton'),
    Textures.findFirst('FlaskButton'),
    Textures.findFirst('IndicatorButton'),
    Textures.findFirst('Back'),
    Textures.findFirst('HCl'),
    Textures.findFirst('H2SO4'),
    Textures.findFirst('NH3'),
    Textures.findFirst('NaOH'),

    // Loading the Materials we are switching on the plane
    Materials.findFirst('glass'),
    Materials.findFirst('HCl'),
    Materials.findFirst('H2SO4'),
    Materials.findFirst('NH3'),
    Materials.findFirst('NaOH'),

    // Loading the plane
    Scene.root.findFirst('BuretteChem Properties'),

    Textures.findFirst('Methyl Orange'),
    Textures.findFirst('Screened Methyl Orange')

// Now, we wait for a "go ahead" from the script to let us know when
// we can start using our assets and creating the NativeUI Picker

]).then(function(results){

    // Assets are loaded, so let's set them all so we can use them later in the script.
    // The assets are all returned in an object called "results" in the order that we
    // loaded them. Remember, the index starts at 0 so the first asset is always results[0],
    // the next is results[1], etc.

    // First, we set the buttons for the NativeUI Picker
    const noneButton = results[0];
    const buretteButton = results[1];
    const flaskButton = results[2];
    const indicatorButton = results[3];
    const backButton = results[4];
    const hclButton = results[5];
    const h2so4Button = results[6];
    const nh3Button = results[7];
    const naohButton = results[8];

    // Next, we set the materials
    const glassMaterial = results[9];
    const hclMaterial = results[10];
    const h2so4Material = results[11];
    const nh3Material = results[12];
    const naohMaterial = results[13];

    const burettechemProperties = results[14];

    const methylOrangeButton = results[15];
    const screenedMethylOrangeButton = results[16];

    const mainMenuConfig = {

      selectedIndex:0,

      items: [
        {image_texture: noneButton},
        {image_texture: buretteButton},
        {image_texture: flaskButton},
        {image_texture: indicatorButton}
      ]

    };

    const buretteButtonConfig = {

      selectedIndex:buretteSelection,

      items: [
        {image_texture: noneButton},
        {image_texture: hclButton},
        {image_texture: h2so4Button},
        {image_texture: nh3Button},
        {image_texture: naohButton},
        {image_texture: backButton}
      ],

      mats: [
        {material: glassMaterial},
        {material: hclMaterial},
        {material: h2so4Material},
        {material: nh3Material},
        {material: naohMaterial}
      ]

    };

    const flaskButtonConfig = {

      selectedIndex:flaskSelection,

      items: [
        {image_texture: noneButton},
        {image_texture: hclButton},
        {image_texture: h2so4Button},
        {image_texture: nh3Button},
        {image_texture: naohButton},
        {image_texture: backButton}
      ],

      mats: [
        {material: glassMaterial},
        {material: hclMaterial},
        {material: h2so4Material},
        {material: nh3Material},
        {material: naohMaterial}
      ]

    };

    const indicatorButtonConfig = {

      selectedIndex:indicatorSelection,

      items: [
        {image_texture: noneButton},
        {image_texture: methylOrangeButton},
        {image_texture: screenedMethylOrangeButton},
        {image_texture: backButton}
      ]

    };

    // Create the NativeUI Picker
    const picker = NativeUI.picker;

    // Load our configuration
    picker.configure(mainMenuConfig);

    // Show the NativeUI Picker
    picker.visible = true;

    // This is a monitor that watches for the picker to be used.
    picker.selectedIndex.monitor().subscribe(function(val1) {

      let val = val1.newValue;
      if (currentSelection == 'Main Menu'){
        if (val==1){
          currentSelection='Burette';
          picker.configure(buretteButtonConfig);
        }
        else if (val==2){
          currentSelection='Flask';
          picker.configure(flaskButtonConfig);
        }
        else if (val==3){
          currentSelection='Indicator';
          picker.configure(indicatorButtonConfig);
        }
      }

      else if (currentSelection == 'Burette'){
        if (val==5){
          currentSelection='Main Menu';
          picker.configure(mainMenuConfig);
        }
        else {
          buretteSelection = val;
          burettechemProperties.material = buretteButtonConfig.mats[val].material;
        }
      }

      else if (currentSelection == 'Flask'){
        if (val==5){
          currentSelection='Main Menu';
          picker.configure(mainMenuConfig);
        }
        else {
          flaskSelection = val;
          solutionProperties.material = flaskButtonConfig.mats[val].material;
        }
      }

      else if (currentSelection == 'Indicator'){
        if (val==3){
          currentSelection='Main Menu';
          picker.configure(mainMenuConfig);
        }
        else {
          indicatorSelection = val;
        }
      }

    });

});











TouchGestures.onPan(flask).subscribe(function (gesture) {
  let gestureTransform = Scene.unprojectToFocalPlane(gesture.location);

  x1 = gestureTransform.x.pinLastValue();
  y1 = gestureTransform.y.pinLastValue();

  flaskTransform.x = Reactive.add(gestureTransform.x, flaskTransform.x.pinLastValue() - x1);
  flaskTransform.y = Reactive.add(gestureTransform.y, flaskTransform.y.pinLastValue() - y1);
  solutionTransform.x = Reactive.add(gestureTransform.x, solutionTransform.x.pinLastValue() - x1);
  solutionTransform.y = Reactive.add(gestureTransform.y, solutionTransform.y.pinLastValue() - y1);
});

TouchGestures.onPan(burette).subscribe(function (gesture) {
  const gestureTransform = Scene.unprojectToFocalPlane(gesture.location);

  x1 = gestureTransform.x.pinLastValue();
  y1 = gestureTransform.y.pinLastValue();

  buretteTransform.x = Reactive.add(gestureTransform.x, buretteTransform.x.pinLastValue() - x1);
  buretteTransform.y = Reactive.add(gestureTransform.y, buretteTransform.y.pinLastValue() - y1);
  buretteChemTransform.x = Reactive.add(gestureTransform.x, buretteChemTransform.x.pinLastValue() - x1);
  buretteChemTransform.y = Reactive.add(gestureTransform.y, buretteChemTransform.y.pinLastValue() - y1);

});

//function for dispensing the chemical in the burette
//If longpress is still in progress, tap stops the longpress
TouchGestures.onTap(burette).subscribe(function (gesture) {
  if (set1 && set2){

    if (longPress === true){
      //purpose of tap here is just to stop the long press
      longPress = false;
      emitter.birthrate = Reactive.val(0);
      stopLongPress();
      //Time.setTimeout(stopSolutionEmit, 1500);
      return;
    }

    emitter.material = matt[buretteSelection - 1];


    emitter.birthrate = Reactive.val(20);
    currentVolume-=0.1;
    currentVolume=Math.round(currentVolume*10)/10;
    Time.setTimeout(stopBurette, 500);

    //Time.setTimeout(startSolutionEmit, 700);
    //Time.setTimeout(stopSolutionEmit, 1500);

  }
});

//on long press of the burette
//particle system continues to emit particles till the tap cease
//volume constantly decreases by 0.1
TouchGestures.onLongPress(burette).subscribe(function(gesture){

  if (set1 && set2){
    emitter.material = matt[buretteSelection - 1];
    emitter.birthrate = Reactive.val(20);
    longPress = true;
    //Time.setTimeout(startSolutionEmit, 500);
    longPressInterval = Time.setInterval(function(){
      currentVolume -= 0.1;
      currentVolume = Math.round(currentVolume*10)/10;
    }, 100);
  }
});

function displayFunction(){
  if (currentVolume < 0.0){
    if (emitter.birthrate.pinLastValue() > 0){
      emitter.birthrate = Reactive.val(0);
    }
    if (longPress === true){
      stopLongPress();
    }

  }

  if (buretteSelection>0 && flaskSelection>0){
    volumeDisplay.text=Reactive.val('Volume:\n' + toNumberString(currentVolume) + 'cm3');
    chemicalDisplay.text = Reactive.val('Burette:\n' + solutionName[buretteSelection] + '\n\n' + 'Flask:\n' + solutionName[flaskSelection] + '\n\n' + 'Indicator:\n' + indicatorName[indicatorSelection]);
    burettechem.transform.scaleY = Reactive.val(10.0*currentVolume/maxVolume);
    burettechem.transform.y = Reactive.val(0.78 - 0.22*(maxVolume - currentVolume)/maxVolume);
  }
}

function updatepH(){
  if (buretteSelection==0 || flaskSelection==0 || indicatorSelection==0) {
    pHDisplay.text = Reactive.val('pH: NIL');
    return;
  }
  var nBurette = nValues[buretteSelection];
  var nFlask = nValues[flaskSelection];
  var equiPoint = 50.0 - 25.0 * nFlask/nBurette;
  var usedVolume = 50.0 - currentVolume;
  var totalVolume = usedVolume + 25.0;
  var pH;
  if (currentVolume > equiPoint){
    var moles = 0.1 * (1 - usedVolume/25.0*nBurette/nFlask);
    var conc = moles / totalVolume;
    if (solutionType[flaskSelection] == 'acid'){
      pH = -Math.log10(conc);
    }
    else if (solutionType[flaskSelection] == 'base'){
      var pOH = -Math.log10(conc);
      pH = 14 - pOH;
    }
  }

  else if (currentVolume == equiPoint){
    pH = 7;
  }

  else {
    var moles = 0.1 * (usedVolume/25.0*nBurette/nFlask - 1);
    var conc = moles / totalVolume;
    if (solutionType[buretteSelection] == 'acid'){
      pH = -Math.log10(conc);
    }
    else if (solutionType[buretteSelection] == 'base'){
      var pOH = -Math.log10(conc);
      pH = 14 - pOH;
    }
  }

  if (pH >= 10.0){
    pH = Math.round(pH * 10)/10;
  }
  else {
    pH = Math.round(pH * 100)/100;
  }
  pHDisplay.text = Reactive.val('pH: ' + toNumberString(pH));
}

function updateColor(){
  var nBurette = nValues[buretteSelection];
  var nFlask = nValues[flaskSelection];
  var equiPoint = 50.0 - 25.0 * nFlask/nBurette;
  if (buretteSelection==0 || flaskSelection==0 || indicatorSelection==0) return;

  var usedVolume = maxVolume - currentVolume;

  if (currentVolume > equiPoint+2.0){
    if (solutionType[flaskSelection]=='acid'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Acidic');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Acidic');
      }
    }
    else if (solutionType[flaskSelection]=='base'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Alkali');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Alkali');
      }
    }
  }

  else if (currentVolume <= equiPoint+2.0 && currentVolume > equiPoint+0.2){
    if (solutionType[flaskSelection]=='acid'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Acidic Near');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Acidic Near');
      }
    }
    else if (solutionType[flaskSelection]=='base'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Alkali Near');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Alkali Near');
      }
    }
  }

  else if (currentVolume <= equiPoint+0.2 && currentVolume >= equiPoint-0.2){
    if (indicatorSelection==1){
      solutionProperties.material = Materials.get('Methyl Orange Equivalence');
    }
    else if (indicatorSelection==2){
      solutionProperties.material = Materials.get('Screened Methyl Orange Equivalence');
    }
  }

  else if (currentVolume < equiPoint-0.2 && currentVolume >= equiPoint-2.0){
    if (solutionType[buretteSelection]=='acid'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Acidic Near');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Acidic Near');
      }
    }
    else if (solutionType[buretteSelection]=='base'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Alkali Near');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Alkali Near');
      }
    }
  }

  else if (currentVolume < equiPoint-2.0){
    if (solutionType[buretteSelection]=='acid'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Acidic');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Acidic');
      }
    }
    else if (solutionType[buretteSelection]=='base'){
      if (indicatorSelection==1){
        solutionProperties.material = Materials.get('Methyl Orange Alkali');
      }
      else if (indicatorSelection==2){
        solutionProperties.material = Materials.get('Screened Methyl Orange Alkali');
      }
    }
  }

  solutionProperties.material.opacity=0.5;
}

const timeInMilliseconds=100;

//const menuTimer = Time.setInterval(menuButtons, 1000);
const textTimer = Time.setInterval(displayFunction, timeInMilliseconds);
const updateColorTimer = Time.setInterval(updateColor, timeInMilliseconds);
const updatepHtimer = Time.setInterval(updatepH, timeInMilliseconds);

function stopLongPress(){
  Time.clearInterval(longPressInterval);
}

function stopTextTimer() {
  Time.clearInterval(textTimer);
}

//stop the particle emitter in the burette from emitting particles
function stopBurette(){
  emitter.birthrate = Reactive.val(0);
}

function stopUpdateColor(){
  Time.clearInterval(updateColorTimer);
}

//start to emit particles from the solution to let
//users see the colour of the indicator
//function startSolutionEmit(){
  //solutionemitter.birthrate = Reactive.val(20);
//}

//function stopSolutionEmit(){
  //solutionemitter.birthrate = Reactive.val(0);
//}
