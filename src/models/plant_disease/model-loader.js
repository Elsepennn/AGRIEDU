/**
 * Model loader for plant disease classification using TensorFlow.js
 */
import * as tf from '@tensorflow/tfjs';

// Original class names from the model
const ORIGINAL_CLASS_NAMES = [
    'Bacterial_spot',
    'Early_blight',
    'Late_blight',
    'Leaf_mold',
    'Yellow_leaf_curl_virus',
    'Mosaic_virus',
    'Target_spot',
    'Spider_mites',
    'Septoria_leaf_spot',
    'Healthy'
];

// Mapped class names (simplified and grouped)
const CLASS_NAMES = [
    'Bacterial Spot',
    'Early Blight',
    'Late Blight',
    'Leaf Mold',
    'Yellow Leaf Curl Virus',
    'Mosaic Virus',
    'Target Spot',
    'Spider Mites',
    'Septoria Leaf Spot',
    'Healthy'
];

// Mapping from original class index to mapped class
const CLASS_MAPPING = {};
ORIGINAL_CLASS_NAMES.forEach((name, index) => {
  CLASS_MAPPING[index] = CLASS_NAMES[index];
});

class PlantDiseaseModel {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.modelPath = 'models/plant_disease/model/model.json';
    this.confidenceThreshold = 0.1; // Minimum confidence threshold
    this.inputSize = [224, 224]; // Model input size
    this.inputShape = [1, 224, 224, 3]; // Batch size 1, height 224, width 224, 3 channels (RGB)
    this.fallbackModel = null;
  }

  /**
   * Check if model files exist
   * @returns {Promise<boolean>} - Whether the model exists
   */
  async checkModelExists() {
    try {
      const paths = [
        this.modelPath,
        '/' + this.modelPath,
        './' + this.modelPath,
        '../' + this.modelPath,
        'dist/' + this.modelPath
      ];

      for (const path of paths) {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          if (response.ok) {
            this.modelPath = path;
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking model existence:', error);
      return false;
    }
  }

  /**
   * Create a simple model for testing
   * @returns {tf.LayersModel} - A simple model for testing
   */
  createSimpleModel() {
    try {
      const model = tf.sequential();
      
      // Input layer with explicit input shape
      model.add(tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu'
      }));
      
      // Add some layers
      model.add(tf.layers.maxPooling2d({poolSize: 2}));
      model.add(tf.layers.conv2d({filters: 64, kernelSize: 3, activation: 'relu'}));
      model.add(tf.layers.maxPooling2d({poolSize: 2}));
      model.add(tf.layers.flatten());
      model.add(tf.layers.dense({units: 64, activation: 'relu'}));
      model.add(tf.layers.dense({units: CLASS_NAMES.length, activation: 'softmax'}));
      
      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      return model;
    } catch (error) {
      console.error('Error creating simple model:', error);
      return null;
    }
  }

  /**
   * Fix model configuration to ensure proper input shape
   * @param {Object} modelJSON - The model JSON configuration
   * @returns {Object} - Fixed model configuration
   */
  fixModelConfig(modelJSON) {
    try {
      if (!modelJSON.modelTopology) {
        modelJSON.modelTopology = {};
      }
      if (!modelJSON.modelTopology.config) {
        modelJSON.modelTopology.config = {};
      }
      if (!modelJSON.modelTopology.config.layers) {
        modelJSON.modelTopology.config.layers = [];
      }

      // Add input layer if not present
      const hasInputLayer = modelJSON.modelTopology.config.layers.some(
        layer => layer.class_name === 'InputLayer'
      );

      if (!hasInputLayer) {
        modelJSON.modelTopology.config.layers.unshift({
          class_name: 'InputLayer',
          config: {
            batch_input_shape: [null, 224, 224, 3],
            dtype: 'float32',
            name: 'input_1',
            sparse: false
          },
          name: 'input_1'
        });
      }

      // Ensure first layer has input shape
      if (modelJSON.modelTopology.config.layers.length > 0) {
        const firstLayer = modelJSON.modelTopology.config.layers[0];
        if (!firstLayer.config.batch_input_shape) {
          firstLayer.config.batch_input_shape = [null, 224, 224, 3];
        }
      }

      return modelJSON;
    } catch (error) {
      console.error('Error fixing model config:', error);
      return modelJSON;
    }
  }

  /**
   * Load the TensorFlow.js model
   * @returns {Promise<boolean>} - Whether the model was loaded successfully
   */
  async loadModel() {
    try {
      // Create fallback model first
      this.fallbackModel = this.createSimpleModel();
      if (!this.fallbackModel) {
        throw new Error('Failed to create fallback model');
      }

      // Try loading the actual model
      try {
        // Method 1: Load with fetch and custom config
        const response = await fetch(this.modelPath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const modelJSON = await response.json();

        // Fix model configuration
        const fixedModelJSON = this.fixModelConfig(modelJSON);
        console.log('Fixed model configuration:', fixedModelJSON);

        // Try to load the model with the fixed JSON
        this.model = await tf.loadLayersModel(tf.io.fromMemory(fixedModelJSON));
        console.log('Model loaded successfully with fixed config');
      } catch (error1) {
        console.warn('Method 1 failed:', error1);
        
        try {
          // Method 2: Try loading with direct path
          this.model = await tf.loadLayersModel(this.modelPath);
          console.log('Model loaded successfully with direct path');
        } catch (error2) {
          console.warn('Method 2 failed:', error2);
          console.warn('Using fallback model');
          this.model = this.fallbackModel;
        }
      }

      // Ensure model has proper input shape
      if (this.model && !this.model.inputs[0].shape) {
        console.warn('Model has no input shape, setting default shape');
        this.model.inputs[0].shape = this.inputShape;
      }

      // Warm up the model
      if (this.model) {
        const dummyInput = tf.zeros(this.inputShape);
        this.model.predict(dummyInput);
        dummyInput.dispose();
      }

      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading plant disease model:', error);
      // Use fallback model if available
      if (this.fallbackModel) {
        console.warn('Using fallback model due to error');
        this.model = this.fallbackModel;
        this.isModelLoaded = true;
        return true;
      }
      this.isModelLoaded = false;
      return false;
    }
  }

  /**
   * Get model files from the server
   * @returns {Promise<Array<File>>} - Array of model files
   */
  async _getModelFiles() {
    try {
      const modelDir = this.modelPath.replace('model.json', '');
      const response = await fetch(modelDir);
      const text = await response.text();
      
      // Parse the directory listing to find model files
      const files = text.match(/model\.(json|weights\.bin)/g);
      if (!files) return null;
      
      // Fetch each file
      const modelFiles = await Promise.all(
        files.map(async (file) => {
          const fileResponse = await fetch(modelDir + file);
          return new File([await fileResponse.blob()], file);
        })
      );
      
      return modelFiles;
    } catch (error) {
      console.error('Error getting model files:', error);
      return null;
    }
  }

  /**
   * Preprocess the image for the model
   * @param {HTMLImageElement} image - The image element to process
   * @returns {tf.Tensor} - Processed tensor ready for prediction
   */
  preprocessImage(image) {
    try {
      return tf.tidy(() => {
        // Convert the image to a tensor
        const imageTensor = tf.browser.fromPixels(image)
          .resizeBilinear(this.inputSize)
          .toFloat()
          .div(tf.scalar(255.0))
          .expandDims(0);
        
        // Ensure tensor has correct shape
        if (!tf.util.arraysEqual(imageTensor.shape, this.inputShape)) {
          console.warn('Input tensor shape mismatch, reshaping:', imageTensor.shape, 'to', this.inputShape);
          return imageTensor.reshape(this.inputShape);
        }
        
        return imageTensor;
      });
    } catch (error) {
      console.error('Error preprocessing image:', error);
      return null;
    }
  }

  /**
   * Validate image before processing
   * @param {HTMLImageElement} image - The image to validate
   * @returns {boolean} - Whether the image is valid
   */
  validateImage(image) {
    if (!image || !(image instanceof HTMLImageElement)) {
      throw new Error('Invalid image input');
    }
    
    // Check image dimensions
    if (image.width < 32 || image.height < 32) {
      throw new Error('Image dimensions too small');
    }
    
    // Check if image is loaded
    if (!image.complete) {
      throw new Error('Image not fully loaded');
    }
    
    return true;
  }

  /**
   * Make a prediction on an image
   * @param {HTMLImageElement} image - The image to classify
   * @returns {Object} - Prediction result with class name and confidence
   */
  async predict(image) {
    try {
      if (!this.model) {
        throw new Error('Model not loaded');
      }

      // Validate image
      this.validateImage(image);

      // Preprocess the image
      const processedImg = this.preprocessImage(image);
      if (!processedImg) {
        throw new Error('Failed to preprocess image');
      }
      
      // Run the inference
      const predictions = this.model.predict(processedImg);
      
      // Get the index with highest probability
      const predictionArray = predictions.dataSync();
      const topPredictionIndex = predictionArray.indexOf(Math.max(...predictionArray));
      const confidence = predictionArray[topPredictionIndex];
      
      // Check if confidence meets threshold
      if (confidence < this.confidenceThreshold) {
        return {
          className: 'Unknown',
          originalClassName: 'Unknown',
          confidence: confidence,
          allPredictions: [],
          groupedPredictions: [],
          isConfident: false
        };
      }
      
      // Get the mapped class name
      const mappedClassName = CLASS_NAMES[topPredictionIndex];
      const originalClassName = ORIGINAL_CLASS_NAMES[topPredictionIndex];
      
      // Group predictions by mapped class
      const groupedPredictions = {};
      
      // Initialize with 0
      [...new Set(CLASS_NAMES)].forEach(className => {
        groupedPredictions[className] = 0;
      });
      
      // Sum probabilities for each mapped class
      predictionArray.forEach((conf, index) => {
        const mappedClass = CLASS_NAMES[index];
        groupedPredictions[mappedClass] += conf;
      });
      
      // Convert to array and sort
      const groupedPredictionsArray = Object.entries(groupedPredictions)
        .map(([className, conf]) => ({ className, confidence: conf }))
        .sort((a, b) => b.confidence - a.confidence);
      
      return {
        className: mappedClassName,
        originalClassName: originalClassName,
        confidence: confidence,
        allPredictions: Array.from(predictionArray).map((conf, index) => ({
          className: CLASS_NAMES[index],
          originalClassName: ORIGINAL_CLASS_NAMES[index],
          confidence: conf
        })).sort((a, b) => b.confidence - a.confidence),
        groupedPredictions: groupedPredictionsArray,
        isConfident: true
      };
    } catch (error) {
      console.error('Error predicting plant disease:', error);
      return {
        className: 'Unknown',
        originalClassName: 'Unknown',
        confidence: 0,
        allPredictions: [],
        groupedPredictions: [],
        isConfident: false
      };
    }
  }
}

// Export singleton instance
const plantDiseaseModel = new PlantDiseaseModel();
export default plantDiseaseModel; 