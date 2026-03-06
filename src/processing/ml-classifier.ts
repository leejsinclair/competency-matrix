import * as tf from "@tensorflow/tfjs-node";
import { FeatureVector } from "./feature-extractor";

export interface MLClassificationResult {
  id: string;
  predictions: {
    competencyCategory: string;
    competencyRow: string;
    level: "L1" | "L2" | "L3" | "L4";
    confidence: number;
    probability: number;
  }[];
  features: FeatureVector;
  algorithm: string;
  timestamp: string;
}

export interface TrainingData {
  features: number[][];
  labels: string[];
  metadata: {
    totalSamples: number;
    categories: string[];
    levels: ("L1" | "L2" | "L3" | "L4")[];
    featureCount: number;
  };
}

export interface MLModelConfig {
  hiddenLayers: number[];
  learningRate: number;
  epochs: number;
  batchSize: number;
  validationSplit: number;
}

export class MLClassifier {
  private model: tf.LayersModel | null = null;
  private config: MLModelConfig;
  private labelEncoder: Map<string, number> = new Map();
  private inverseLabelEncoder: Map<number, string> = new Map();

  constructor(config?: Partial<MLModelConfig>) {
    this.config = {
      hiddenLayers: [64, 32, 16],
      learningRate: 0.001,
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      ...config,
    };
  }

  async trainModel(trainingData: TrainingData): Promise<void> {
    console.log(
      `🧠 Training ML model with ${trainingData.metadata.totalSamples} samples`
    );

    const { features, labels } = this.prepareTrainingData(trainingData);

    this.model = this.createModel(
      trainingData.metadata.featureCount,
      this.labelEncoder.size
    );

    this.model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    console.log("📊 Starting training...");
    const history = await this.model.fit(features, labels, {
      epochs: this.config.epochs,
      batchSize: this.config.batchSize,
      validationSplit: this.config.validationSplit,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            const loss = typeof logs?.loss === "number" ? logs.loss : 0;
            const acc = typeof logs?.acc === "number" ? logs.acc : 0;
            console.log(
              `Epoch ${epoch}: loss = ${loss.toFixed(4)}, accuracy = ${acc.toFixed(4)}`
            );
          }
        },
      },
    });

    console.log("✅ Training completed");
    console.log(
      `Final accuracy: ${(history.history.acc[history.history.acc.length - 1] as any)?.toFixed(4)}`
    );
  }

  async classify(
    featureVector: FeatureVector
  ): Promise<MLClassificationResult> {
    if (!this.model) {
      throw new Error("Model not trained. Call trainModel() first.");
    }

    const inputTensor = tf.tensor2d([featureVector.vector]);

    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const probabilities = (await prediction.data()) as Float32Array;

    const results = this.convertProbabilitiesToResults(probabilities);

    inputTensor.dispose();
    prediction.dispose();

    return {
      id: featureVector.id,
      predictions: results,
      features: featureVector,
      algorithm: "tensorflow-js-neural-network",
      timestamp: new Date().toISOString(),
    };
  }

  async classifyBatch(
    featureVectors: FeatureVector[]
  ): Promise<MLClassificationResult[]> {
    if (!this.model) {
      throw new Error("Model not trained. Call trainModel() first.");
    }

    const results: MLClassificationResult[] = [];

    const batchSize = 100;
    for (let i = 0; i < featureVectors.length; i += batchSize) {
      const batch = featureVectors.slice(i, i + batchSize);
      const batchResults = await this.classifyBatchInternal(batch);
      results.push(...batchResults);
    }

    return results;
  }

  async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error("No model to save");
    }

    await this.model.save(`file://${path}`);
    console.log(`💾 Model saved to ${path}`);
  }

  async loadModel(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    console.log(`📂 Model loaded from ${path}`);
  }

  getModelSummary(): string {
    if (!this.model) {
      return "No model loaded";
    }

    const summary: string[] = [];
    this.model.summary(undefined, undefined, (line: string) =>
      summary.push(line)
    );
    return summary.join("\n");
  }

  createTrainingDataFromRules(
    featureVectors: FeatureVector[],
    ruleClassifications: Array<{ id: string; labels: any[] }>
  ): TrainingData {
    const features: number[][] = [];
    const labels: string[] = [];
    const categories = new Set<string>();
    const levels = new Set<"L1" | "L2" | "L3" | "L4">();

    const classificationMap = new Map(
      ruleClassifications.map((rc) => [rc.id, rc.labels])
    );

    for (const featureVector of featureVectors) {
      const ruleLabels = classificationMap.get(featureVector.id);
      if (!ruleLabels || ruleLabels.length === 0) continue;

      const topLabel = ruleLabels.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      const labelString = `${topLabel.competencyCategory}/${topLabel.competencyRow}/${topLabel.level.name}`;

      features.push(featureVector.vector);
      labels.push(labelString);

      categories.add(topLabel.competencyCategory);
      levels.add(topLabel.level.name as "L1" | "L2" | "L3" | "L4");
    }

    return {
      features,
      labels,
      metadata: {
        totalSamples: features.length,
        categories: Array.from(categories),
        levels: Array.from(levels),
        featureCount: features[0]?.length || 0,
      },
    };
  }

  private createModel(inputSize: number, outputSize: number): tf.LayersModel {
    const model = tf.sequential();

    model.add(
      tf.layers.dense({
        inputShape: [inputSize],
        units: this.config.hiddenLayers[0],
        activation: "relu",
        name: "input_layer",
      })
    );

    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      model.add(
        tf.layers.dense({
          units: this.config.hiddenLayers[i],
          activation: "relu",
          name: `hidden_layer_${i}`,
        })
      );

      model.add(
        tf.layers.dropout({
          rate: 0.3,
          name: `dropout_${i}`,
        })
      );
    }

    model.add(
      tf.layers.dense({
        units: outputSize,
        activation: "softmax",
        name: "output_layer",
      })
    );

    return model;
  }

  private prepareTrainingData(trainingData: TrainingData): {
    features: tf.Tensor2D;
    labels: tf.Tensor2D;
  } {
    this.createLabelEncoder(trainingData.labels);

    const featuresTensor = tf.tensor2d(trainingData.features);

    const encodedLabels = trainingData.labels.map(
      (label) => this.labelEncoder.get(label) || 0
    );
    const labelsTensor = tf.oneHot(
      tf.tensor1d(encodedLabels, "int32"),
      this.labelEncoder.size
    );

    return {
      features: featuresTensor,
      labels: labelsTensor as tf.Tensor2D,
    };
  }

  private createLabelEncoder(labels: string[]): void {
    const uniqueLabels = [...new Set(labels)];

    this.labelEncoder.clear();
    this.inverseLabelEncoder.clear();

    uniqueLabels.forEach((label, index) => {
      this.labelEncoder.set(label, index);
      this.inverseLabelEncoder.set(index, label);
    });
  }

  private convertProbabilitiesToResults(
    probabilities: Float32Array
  ): MLClassificationResult["predictions"] {
    const results: MLClassificationResult["predictions"] = [];

    const sortedIndices = Array.from(probabilities.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    for (const [index, probability] of sortedIndices) {
      const label = this.inverseLabelEncoder.get(index);
      if (!label) continue;

      const [category, row, level] = label.split("/");

      results.push({
        competencyCategory: category,
        competencyRow: row,
        level: level as "L1" | "L2" | "L3" | "L4",
        confidence: probability,
        probability: probability,
      });
    }

    return results;
  }

  private async classifyBatchInternal(
    featureVectors: FeatureVector[]
  ): Promise<MLClassificationResult[]> {
    if (!this.model) {
      throw new Error("Model not trained");
    }

    const batchFeatures = featureVectors.map((fv) => fv.vector);
    const inputTensor = tf.tensor2d(batchFeatures);

    const predictions = this.model.predict(inputTensor) as tf.Tensor;
    const probabilities = (await predictions.data()) as Float32Array;

    const results: MLClassificationResult[] = [];
    const numClasses = this.labelEncoder.size;

    for (let i = 0; i < featureVectors.length; i++) {
      const startIndex = i * numClasses;
      const classProbabilities = probabilities.slice(
        startIndex,
        startIndex + numClasses
      );

      const predictionResults =
        this.convertProbabilitiesToResults(classProbabilities);

      results.push({
        id: featureVectors[i].id,
        predictions: predictionResults,
        features: featureVectors[i],
        algorithm: "tensorflow-js-neural-network",
        timestamp: new Date().toISOString(),
      });
    }

    inputTensor.dispose();
    predictions.dispose();

    return results;
  }
}
