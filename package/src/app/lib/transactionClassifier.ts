export type Category =
  | "Transport"
  | "Food"
  | "Groceries"
  | "Shopping"
  | "Bills"
  | "Entertainment";

export interface TrainingData {
  text: string;
  category: Category;
}

export class NaiveBayesClassifier {
  public classCounts: Record<Category, number> = {
    Transport: 0,
    Food: 0,
    Groceries: 0,
    Shopping: 0,
    Bills: 0,
    Entertainment: 0,
  };
  public featureCounts: Record<string, Record<Category, number>> = {};
  public totalDocuments = 0;
  public vocabulary = new Set<string>();

  constructor(public trainingData: TrainingData[]) {
    this.train();
  }

  public preprocess(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/);
  }

  train() {
    // Count classes and features
    this.trainingData.forEach(({ text, category }) => {
      this.classCounts[category]++;
      this.totalDocuments++;

      const words = this.preprocess(text);
      words.forEach((word) => {
        this.vocabulary.add(word);
        if (!this.featureCounts[word]) {
          this.featureCounts[word] = {
            Transport: 0,
            Food: 0,
            Groceries: 0,
            Shopping: 0,
            Bills: 0,
            Entertainment: 0,
          };
        }
        this.featureCounts[word][category]++;
      });
    });
  }

  classify(text: string): { category: Category; confidence: number } {
    const words = this.preprocess(text);
    const categories = Object.keys(this.classCounts) as Category[];

    // Initialize log probabilities
    const logProbs: Record<Category, number> = {
      Transport: 0,
      Food: 0,
      Groceries: 0,
      Shopping: 0,
      Bills: 0,
      Entertainment: 0,
    };

    // Calculate prior probabilities
    categories.forEach((category) => {
      logProbs[category] = Math.log(
        this.classCounts[category] / this.totalDocuments
      );
    });

    // Apply likelihoods
    words.forEach((word) => {
      categories.forEach((category) => {
        const wordCount = this.featureCounts[word]?.[category] || 0;
        const totalWordsInCategory = Object.values(this.featureCounts).reduce(
          (sum, counts) => sum + (counts[category] || 0),
          0
        );

        // Laplace smoothing
        const prob =
          (wordCount + 0.1) /
          (totalWordsInCategory + 0.1 * this.vocabulary.size);

        logProbs[category] += Math.log(prob);
      });
    });

    // Find the most probable category
    let maxCategory: Category = "Transport";
    let maxLogProb = -Infinity;

    categories.forEach((category) => {
      if (logProbs[category] > maxLogProb) {
        maxLogProb = logProbs[category];
        maxCategory = category;
      }
    });

    // Convert log probabilities to normalized confidence (0-1)
    const logProbValues = Object.values(logProbs);
    const maxLog = Math.max(...logProbValues);
    const temperature = 0.6;
    const expLogProbs = logProbValues.map(lp => Math.exp((lp - maxLog) / temperature));
    const confidence = expLogProbs[logProbValues.indexOf(maxLogProb)] / 
                      expLogProbs.reduce((a, b) => a + b);

    return {
      category: maxCategory,
      confidence: confidence,
    };
  }
}
