const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) { 
  const image = await Jimp.read(inputFile); //await gwarantuje, że kompilacja nie pójdzie do przodu, dopóki ten plik nie zostanie załadowany
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  image.print(font, 0, 0, {text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE}, image.getWidth(), image.getHeight());
  await image.quality(100).writeAsync(outputFile);
};

addTextWatermarkToImage('./test.jpg', './test-with-watermark.jpg', 'Manul - the strangest cat in the world');

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  const image = await Jimp.read(inputFile);
  const watermark = await Jimp.read(watermarkFile);
  const x = image.getWidth() / 2 - watermark.getWidth() / 2;
  const y = image.getHeight() / 2 - watermark.getHeight() / 2;
  
  image.composite(watermark, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.5,
  });
  await image.quality(100).writeAsync(outputFile);
};

addImageWatermarkToImage('./test.jpg', './test-with-watermark2.jpg', './logo.png');

const changeBrightness = async function(inputFile, outputFile, value){ 
  const image = await Jimp.read(inputFile);
  image.brightness(value).writeAsync(outputFile);
}

const increaseContrast = async function(inputFile, outputFile, value){ 
  const image = await Jimp.read(inputFile);
  image.contrast(value).writeAsync(outputFile);
}

const addGreyscale = async function(inputFile, outputFile){ 
  const image = await Jimp.read(inputFile);
  image.greyscale().writeAsync(outputFile);
}

const invertTheImageColours = async function(inputFile, outputFile){ 
  const image = await Jimp.read(inputFile);
  image.invert().writeAsync(outputFile);
}

const prepareOutputFilename = function(filename, edit = false){
  const [name, ext] = filename.split('.');
  return edit ? './edit/' + name + '.' + ext : './watermark/' + name + '-with-watermark.' + ext;
}

const prepareInputFilename = function(filename){
  return fs.existsSync('./edit/' + filename) ? './edit/' + filename : './img/' + filename;	
}

const startApp = async () => {

  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  if(!answer.start) process.exit();

  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }, {
    name: 'editFile',
    message: 'Do you want edit file?',
    type: 'confirm'
  }]);
  
  while(options.editFile){
    const editOptions = await inquirer.prompt([{
      name: 'editType',
      type: 'list',
      choices: ['Make image brighter', 'Increase contrast', 'Make image black and white', 'Invert image'],
    }]);  
	
	switch (editOptions.editType) {
	  case 'Make image brighter':
		{
		  const brightness = await inquirer.prompt([{
            name: 'editValue',
            type: 'input',
            message: 'Enter a value from -1 to 1 to adjust the brightness',
          }]);
		  const value = parseFloat(brightness.editValue); 
		  if(value >= -1 && value <= 1 ){
			    if(fs.existsSync('./img/' + options.inputImage)){ 
					changeBrightness(prepareInputFilename(options.inputImage), prepareOutputFilename(options.inputImage, true), value);
					console.log('Brightness has been changed');
				  } else console.log('Something went wrong... Try again'); 
		  } else console.log('Something went wrong... Try again'); 
		}
		break;
	  case 'Increase contrast':
		{
		  const contrast = await inquirer.prompt([{
            name: 'editValue',
            type: 'input',
            message: 'Enter a value from -1 to 1 to adjust the contrast',
          }]);
		  const value = parseFloat(contrast.editValue);
		  if(value >= -1 && value <= 1 ){
			    if(fs.existsSync('./img/' + options.inputImage)){ 
					increaseContrast(prepareInputFilename(options.inputImage), prepareOutputFilename(options.inputImage, true), value);
					console.log('Contrast has been changed');
				  } else console.log('Something went wrong... Try again'); 
		  } else console.log('Something went wrong... Try again'); 
		}
		break;
	  case 'Make image black and white':
	  {
		 if(fs.existsSync('./img/' + options.inputImage)){ 
		   addGreyscale(prepareInputFilename(options.inputImage), prepareOutputFilename(options.inputImage, true));
		   console.log('Color from image was removed');
	    } else console.log('Something went wrong... Try again'); 
	  }
	  break;
	  case 'Invert image':
	  {
		 if(fs.existsSync('./img/' + options.inputImage)){ 
		   invertTheImageColours(prepareInputFilename(options.inputImage), prepareOutputFilename(options.inputImage, true));
		   console.log('The colors of the image have been inverted');
	    } else console.log('Something went wrong... Try again'); 
	  }
	  break;
	  default:
	}  
	const continueEdit = await inquirer.prompt([{
      name: 'edit',
      message: 'Do you want to continue edit?',
      type: 'confirm'
    }]);
	options.editFile = continueEdit.edit;
}

  const watermarkOptions = await inquirer.prompt([{
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);
  
  if(watermarkOptions.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
	
  watermarkOptions.watermarkText = text.value; 
  
      if(fs.existsSync('./img/' + options.inputImage)){
        addTextWatermarkToImage(prepareInputFilename(options.inputImage), prepareOutputFilename(options.inputImage), watermarkOptions.watermarkText);
	    console.log('Watermark has been added');
	    startApp();
     } else { 
        console.log('Something went wrong... Try again'); 
	    startApp(); 
      }
    }
  else {
    const image = await inquirer.prompt([{
    name: 'filename',
    type: 'input',
    message: 'Type your watermark name:',
    default: 'logo.png',
  }]);
    watermarkOptions.watermarkImage = image.filename;
	
  if(fs.existsSync('./img/' + options.inputImage) && fs.existsSync('./img/' + watermarkOptions.watermarkImage)){
    addImageWatermarkToImage(prepareInputFilename(options.inputImage), prepareOutputFilename(options.inputImage), './img/' + watermarkOptions.watermarkImage);
    console.log('Watermark has been added');
	startApp();
  } else { 
      console.log('Something went wrong... Try again'); 
	  startApp(); 
    }
  }
 if(fs.existsSync('./edit/' + options.inputImage)){
	  fs.unlinkSync('./edit/' + options.inputImage);
  }
  
}

startApp();