# PMML Editor User Guide

## Introduction to PMML

**Predictive Model Markup Language (PMML)** is an XML-based standard used to represent predictive models. It allows different applications to easily share models, making it possible to develop a model in one system (like a data science tool) and deploy it in another (like a business rules engine).

In the context of Apache KIE, PMML is used alongside **DMN (Decision Model and Notation)** to combine predictive analytics with decision logic.

## PMML for DMN Users

If you are familiar with DMN, you can think of PMML as a specialized way to define decision logic, specifically optimized for statistical and machine learning models.

| DMN Concept | PMML Equivalent |
| --- | --- |
| **Item Definition** | **Data Dictionary** |
| **Input Data** | **Mining Schema** (Active fields) |
| **Decision Logic** | **Model** (e.g., Scorecard, Tree Model) |
| **Decision Output** | **Output** |
| **BKM** | A PMML model is often called from a DMN **Business Knowledge Model (BKM)**. |

In a typical hybrid solution, DMN handles the high-level business rules (e.g., "Should we approve this loan?"), while PMML provides a specific score or prediction (e.g., "What is the probability of default?") that the DMN model uses as input.

## Core PMML Concepts

### 1. Header
Contains metadata about the model, such as the copyright, description, and timestamp.

### 2. Data Dictionary
Defines all possible fields that can be used by any model within the PMML document. Each field has a name, a display name, an operational type (continuous, categorical, or ordinal), and a data type (string, integer, double, etc.).

### 3. Mining Schema
A subset of the Data Dictionary that defines which fields are used by a *specific* model. It specifies the "usage type" of each field:
- **active**: Input field.
- **predicted**: Output field produced by the model.
- **supplementary**: Extra information not used for prediction.

### 4. Scorecard Model
The PMML Editor primarily focuses on **Scorecards**. A scorecard is a type of model where points are assigned to different attributes of the input data, and the final score is the sum of these points.

- **Characteristics**: A scorecard contains one or more characteristics (e.g., "Age", "Income").
- **Attributes**: Each characteristic contains multiple attributes. An attribute defines a condition (e.g., "Age < 18") and the partial score assigned if that condition is met.
- **Initial Score**: A starting value for the scorecard before any characteristics are evaluated.

### 5. Outputs
Defines the results produced by the model. For a scorecard, this is typically the final calculated score, but it can also include "Reason Codes" explaining why a certain score was reached.

## Using the PMML Editor

### Landing Page
When you open a PMML file, you are greeted by a landing page that lists all the models defined in the document. You can add new models or click on an existing one to edit it.

### Data Dictionary Editor
You can manage the global fields in the **Data Dictionary** tab. Here you define the types and constraints for all data that the models will use.

### Scorecard Editor
Clicking on a Scorecard model opens the specialized editor:
- **Mining Schema Tab**: Map Data Dictionary fields to your model.
- **Characteristics Tab**: Define the logic of your scorecard by adding characteristics and attributes.
- **Outputs Tab**: Define what the model returns.

## Business Use Cases

### 1. Credit Risk Assessment
A bank wants to automate loan approvals. They use a **Scorecard** to calculate a credit score based on:
- Applicant's age.
- Monthly income.
- Employment status.
- Existing debt.

The resulting score is then used in a DMN model to decide if the loan is "Auto-Approved", "Auto-Rejected", or sent for "Manual Review".

### 2. Customer Retention (Churn Prediction)
A telecommunications company wants to identify customers likely to cancel their subscription. They use a PMML model to analyze:
- Call frequency.
- Data usage patterns.
- Customer support interactions.

The model predicts the probability of churn. A DMN decision then determines an appropriate retention offer based on that probability and the customer's lifetime value.

### 3. Healthcare Risk Stratification
A healthcare provider uses PMML to predict the risk of hospital readmission for patients being discharged. The model considers:
- Previous admissions.
- Diagnosis codes.
- Age and vital signs.

The risk score helps doctors decide on the level of post-discharge follow-up care required.

## Integrating PMML with DMN

To use a PMML model in DMN:
1. Create a **Business Knowledge Model (BKM)** in your DMN file.
2. Set the BKM's logic type to **PMML**.
3. Point to the PMML file and the specific model name.
4. Call this BKM from a **Decision** node, passing the required inputs from the DMN model.
