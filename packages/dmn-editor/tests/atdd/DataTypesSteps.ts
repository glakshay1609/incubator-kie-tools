import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "chai";
import { WebDriver, By, until, Key, WebElement } from "selenium-webdriver";

// Assuming a world object or a static driver instance
declare const driver: WebDriver;

// Helper functions for shared logic
async function clearInput(element: WebElement) {
  const value = await element.getAttribute("value");
  for (let i = 0; i < value.length; i++) {
    await element.sendKeys(Key.BACK_SPACE);
  }
}

async function selectDataTypeByName(name: string) {
  const item = await driver.wait(
    until.elementLocated(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`)),
    10000
  );
  await item.click();
}

async function createDataType(name: string) {
  const items = await driver.findElements(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`));
  if (items.length === 0) {
    const addButton = await driver.findElement(By.css('[aria-label="Add Data Type"]'));
    await addButton.click();
    const newItem = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='tNewDataType']")), 10000);
    await driver.actions().doubleClick(newItem).perform();
    const input = await driver.switchTo().activeElement();
    await clearInput(input);
    await input.sendKeys(name, Key.ENTER);
  }
}

Given("I am in the DMN Editor's Data Types tab", async function () {
  const dataTypesTab = await driver.wait(until.elementLocated(By.css('[data-testid="kie-tools--dmn-editor--data-types-tab"]')), 10000);
  await dataTypesTab.click();
});

Then("I should see the {string} empty state", async function (text) {
  const emptyState = await driver.findElement(By.className("kie-dmn-editor--data-types-empty-state"));
  const body = await emptyState.getText();
  expect(body).to.contain(text);
});

Then("the {string} button should be visible", async function (label) {
  const button = await driver.findElement(By.xpath(`//button[contains(., '${label}')]`));
  expect(await button.isDisplayed()).to.be.true;
});

When("I click on the {string} button", async function (label) {
  const button = await driver.findElement(By.xpath(`//button[contains(., '${label}')]`));
  await button.click();
});

Then("a new Data Type named {string} should be created", async function (name) {
  const item = await driver.wait(
    until.elementLocated(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`)),
    10000
  );
  expect(await item.isDisplayed()).to.be.true;
});

Then("the Data Type Panel should be open for {string}", async function (name) {
  const panelTitle = await driver.wait(until.elementLocated(By.css(".kie-dmn-editor--data-types-title")), 10000);
  expect(await panelTitle.getText()).to.contain(name);
});

Given("a Data Type named {string} exists", async function (name) {
  await createDataType(name);
});

Given("the following Data Types exist:", async function (dataTable: DataTable) {
  const names = dataTable.hashes().map(row => row.name);
  for (const name of names) {
    await createDataType(name);
  }
});

When("I rename the Data Type {string} to {string}", async function (oldName, newName) {
  const item = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${oldName}']`));
  await driver.actions().doubleClick(item).perform();
  const input = await driver.switchTo().activeElement();
  await clearInput(input);
  await input.sendKeys(newName, Key.ENTER);
});

Then("I should see the Data Type {string} in the list", async function (name) {
  const item = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`)), 10000);
  expect(await item.isDisplayed()).to.be.true;
});

Then("the Data Type {string} should not exist", async function (name) {
  const items = await driver.findElements(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`));
  expect(items.length).to.equal(0);
});

When("I toggle the {string} switch", async function (label) {
  const switchContainer = await driver.findElement(By.xpath(`//label[contains(., '${label}')]/following-sibling::span[contains(@class, 'pf-c-switch')]`));
  const input = await switchContainer.findElement(By.css("input"));
  await input.click();
});

Given("{string} is a struct", async function (name) {
  await selectDataTypeByName(name);
  const isStructSwitch = await driver.findElement(By.xpath("//label[contains(., 'Is struct?')]/../input"));
  if (!(await isStructSwitch.isSelected())) {
    await isStructSwitch.click();
  }
});

Given("{string} is a collection", async function (name) {
    await selectDataTypeByName(name);
    const isCollectionSwitch = await driver.findElement(By.xpath("//label[contains(., 'Is collection?')]/../input"));
    if (!(await isCollectionSwitch.isSelected())) {
      await isCollectionSwitch.click();
    }
});

When("I select the Data Type {string}", async function (name) {
  await selectDataTypeByName(name);
});

Then("the Data Type {string} should be a {word}", async function (name, state) {
  if (state === "collection") {
    const isCollectionSwitch = await driver.findElement(By.xpath("//label[contains(., 'Is collection?')]/../input"));
    expect(await isCollectionSwitch.isSelected()).to.be.true;
  } else if (state === "struct") {
    const propertiesTable = await driver.findElements(By.className("kie-dmn-editor--data-type-properties-table"));
    expect(propertiesTable.length).to.be.greaterThan(0);
  }
});

Given("{string} is of type {string}", async function (typeName, baseType) {
    await selectDataTypeByName(typeName);
    const typeSelector = await driver.findElement(By.css(".pf-c-select"));
    await typeSelector.click();
    const option = await driver.wait(until.elementLocated(By.xpath(`//li//button[contains(., '${baseType}')]`)), 10000);
    await option.click();
});

When("I add a property named {string} to {string}", async function (propName, typeName) {
  const addPropButton = await driver.findElement(By.xpath(`//button[contains(., "Add property to '${typeName}'")]`));
  await addPropButton.click();
  const lastInput = await driver.switchTo().activeElement();
  await clearInput(lastInput);
  await lastInput.sendKeys(propName, Key.ENTER);
});

When("I add a property {string} to {string} with type {string}", async function (propName, typeName, associatedType) {
    const addPropButton = await driver.findElement(By.xpath(`//button[contains(., "Add property to '${typeName}'")]`));
    await addPropButton.click();
    const lastInput = await driver.switchTo().activeElement();
    await clearInput(lastInput);
    await lastInput.sendKeys(propName, Key.ENTER);

    const propRow = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${propName}')]`)), 10000);
    const typeSelector = await propRow.findElement(By.className("pf-c-select"));
    await typeSelector.click();
    const option = await driver.wait(until.elementLocated(By.xpath(`//li//button[contains(., '${associatedType}')]`)), 10000);
    await option.click();
});

Given("{string} has a property {string}", async function (typeName, propName) {
    const addPropButton = await driver.findElement(By.xpath(`//button[contains(., "Add property to '${typeName}'")]`));
    await addPropButton.click();
    const lastInput = await driver.switchTo().activeElement();
    await clearInput(lastInput);
    await lastInput.sendKeys(propName, Key.ENTER);
});

Given("{string} has a property {string} which is a struct", async function (parentProp, childProp) {
    const row = await driver.findElement(By.xpath(`//tr[contains(., '${parentProp}')]`));
    const isStructSwitch = await row.findElement(By.css('input[aria-label="Is struct?"]'));
    if (!(await isStructSwitch.isSelected())) {
        await isStructSwitch.click();
    }
    const addPropButton = await row.findElement(By.css('button[title="Add item component"]'));
    await addPropButton.click();
    const lastInput = await driver.switchTo().activeElement();
    await clearInput(lastInput);
    await lastInput.sendKeys(childProp, Key.ENTER);
});

Given("{string} has a property {string} which is a collection", async function (parentProp, childProp) {
    const row = await driver.findElement(By.xpath(`//tr[contains(., '${parentProp}')]`));
    const isCollectionSwitch = await row.findElement(By.css('input[aria-label="Is collection?"]'));
    if (!(await isCollectionSwitch.isSelected())) {
        await isCollectionSwitch.click();
    }
});

Given("{string} has a property {string} of type {string}", async function (parentProp, childProp, typeName) {
    const row = await driver.findElement(By.xpath(`//tr[contains(., '${parentProp}')]`));
    const addPropButton = await row.findElement(By.css('button[title="Add item component"]'));
    await addPropButton.click();
    const lastInput = await driver.switchTo().activeElement();
    await clearInput(lastInput);
    await lastInput.sendKeys(childProp, Key.ENTER);

    const propRow = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${childProp}')]`)), 10000);
    const typeSelector = await propRow.findElement(By.className("pf-c-select"));
    await typeSelector.click();
    const option = await driver.wait(until.elementLocated(By.xpath(`//li//button[contains(., '${typeName}')]`)), 10000);
    await option.click();
});

Then("{string} should have a property {string}", async function (typeName, propName) {
  const propertyRow = await driver.wait(until.elementLocated(By.xpath(`//table//span[text()='${propName}']`)), 10000);
  expect(await propertyRow.isDisplayed()).to.be.true;
});

Then("I should see the property {string} nested under {string} under {string}", async function (prop, p2, p1) {
    const row = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${prop}')]`)), 10000);
    expect(await row.isDisplayed()).to.be.true;
});

When("I set a {string} constraint with value {string}", async function (constraintType, value) {
    let buttonId = constraintType;
    if (constraintType === "Collection") buttonId = "Expression";
    if (constraintType === "Collection item") buttonId = "Expression";

    const toggleButton = await driver.wait(until.elementLocated(By.id(buttonId)), 10000);
    await toggleButton.click();

    if (buttonId === "Enumeration") {
        const addButton = await driver.findElement(By.xpath("//button[contains(., 'Add')]"));
        await addButton.click();
        const input = await driver.switchTo().activeElement();
        await clearInput(input);
        await input.sendKeys(value, Key.ENTER);
    } else if (buttonId === "Range") {
        const rangeParts = value.match(/([\[\(])(.+)\.\.(.+)([\]\)])/);
        if (rangeParts) {
            const [_, startBracket, start, end, endBracket] = rangeParts;
            const startInclude = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-start-include'));
            await startInclude.click();
            const startIncludeOption = await driver.wait(until.elementLocated(By.xpath(`//li[contains(., '${startBracket === "[" ? "Include" : "Exclude"}')]`)), 10000);
            await startIncludeOption.click();

            const startInput = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-start-value input'));
            await startInput.sendKeys(start);

            const endInput = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-end-value input'));
            await endInput.sendKeys(end);

            const endInclude = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-end-include'));
            await endInclude.click();
            const endIncludeOption = await driver.wait(until.elementLocated(By.xpath(`//li[contains(., '${endBracket === "]" ? "Include" : "Exclude"}')]`)), 10000);
            await endIncludeOption.click();
        }
    } else {
        const textArea = await driver.findElement(By.css(".kie-dmn-editor--constraints-expression textarea"));
        await textArea.sendKeys(value);
    }
});

Then("the Data Type {string} should have the {string} constraint {string}", async function (name, level, value) {
    const body = await driver.findElement(By.css("body")).getText();
    expect(body).to.contain(value);
});

Then("the Data Type {string} should have the constraint {string}", async function (name, value) {
  const body = await driver.findElement(By.css("body")).getText();
  expect(body).to.contain(value);
});

When("I click the {string} button in the Data Type Panel for {string}", async function (btnTitle, name) {
    const btn = await driver.wait(until.elementLocated(By.xpath(`//button[@title='${btnTitle}']`)), 10000);
    await btn.click();
});

Given("{string} is associated with type {string}", async function (derived, base) {
    await selectDataTypeByName(derived);
    const typeSelector = await driver.findElement(By.css(".pf-c-select"));
    await typeSelector.click();
    const option = await driver.wait(until.elementLocated(By.xpath(`//li//button[contains(., '${base}')]`)), 10000);
    await option.click();
});

Given("{string} has a property of type {string}", async function (usage, source) {
    const addPropButton = await driver.findElement(By.xpath(`//button[contains(., "Add property to '${usage}'")]`));
    await addPropButton.click();
    const lastInput = await driver.switchTo().activeElement();
    await clearInput(lastInput);
    await lastInput.sendKeys("tmpProp", Key.ENTER);

    const propRow = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., 'tmpProp')]`)), 10000);
    const typeSelector = await propRow.findElement(By.className("pf-c-select"));
    await typeSelector.click();
    const option = await driver.wait(until.elementLocated(By.xpath(`//li//button[contains(., '${source}')]`)), 10000);
    await option.click();
});

When("I confirm the refactor in the confirmation dialog", async function () {
    const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Confirm')]")), 10000);
    await confirmBtn.click();
});

Then("the property of {string} should now have type {string}", async function (usage, typeName) {
    await selectDataTypeByName(usage);
    const typeLabel = await driver.wait(until.elementLocated(By.className("kie-dmn-editor--type-ref-label")), 10000);
    expect(await typeLabel.getText()).to.equal(typeName);
});

When("I delete the Data Type {string}", async function (name) {
  const kebab = await driver.wait(until.elementLocated(By.id("toggle-kebab-top-level")), 10000);
  await kebab.click();
  const removeButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Remove')]")), 10000);
  await removeButton.click();
});

When("I filter the Data Types list with {string}", async function (filterText) {
  const filterInput = await driver.findElement(By.css('input[placeholder="Filter..."]'));
  await filterInput.sendKeys(filterText);
});

When("I copy the Data Type {string}", async function (name) {
  const kebab = await driver.wait(until.elementLocated(By.id("toggle-kebab-top-level")), 10000);
  await kebab.click();
  const copyButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Copy')]")), 10000);
  await copyButton.click();
});

When("I paste the Data Type", async function () {
  const addKebab = await driver.wait(until.elementLocated(By.id("add-data-type-toggle")), 10000);
  await addKebab.click();
  const pasteButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Paste')]")), 10000);
  await pasteButton.click();
});

When("I extract the property {string} from {string} to a top-level Data Type", async function (propName, structName) {
  const propKebab = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${propName}')]//button[contains(@id, 'toggle-kebab')]`)), 10000);
  await propKebab.click();
  const extractButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Extract data type')]")), 10000);
  await extractButton.click();
});

Then("a new Data Type named {string} should exist", async function (name) {
    const item = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`)), 10000);
    expect(await item.isDisplayed()).to.be.true;
});

Then("the property {string} of {string} should have type {string}", async function (propName, structName, typeName) {
    const propRow = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${propName}')]`)), 10000);
    const typeLabel = await propRow.findElement(By.className("kie-dmn-editor--type-ref-label"));
    expect(await typeLabel.getText()).to.equal(typeName);
});

When("I expand the property {string}", async function (propName) {
  const expandButton = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${propName}')]//button[@title='Expand / collapse item component']`)), 10000);
  const icon = await expandButton.findElement(By.css("svg"));
  const iconClass = await icon.getAttribute("class");
  if (iconClass.includes("angle-right")) {
      await expandButton.click();
  }
});

When("I collapse the property {string}", async function (propName) {
    const expandButton = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${propName}')]//button[@title='Expand / collapse item component']`)), 10000);
    const icon = await expandButton.findElement(By.css("svg"));
    const iconClass = await icon.getAttribute("class");
    if (iconClass.includes("angle-down")) {
        await expandButton.click();
    }
});

Then("I should see the property {string}", async function (propName) {
    const prop = await driver.wait(until.elementLocated(By.xpath(`//table//span[text()='${propName}']`)), 10000);
    expect(await prop.isDisplayed()).to.be.true;
});

Then("I should not see the property {string}", async function (propName) {
    const props = await driver.findElements(By.xpath(`//table//span[text()='${propName}']`));
    if (props.length > 0) {
        expect(await props[0].isDisplayed()).to.be.false;
    }
});

Given("an external model named {string} with a Data Type {string} is imported", async function (modelName, typeName) {
    // Navigate to Included Models tab and import a model
    const includedModelsTab = await driver.wait(until.elementLocated(By.css('[data-testid="kie-tools--dmn-editor--included-models-tab"]')), 10000);
    await includedModelsTab.click();
    const includeModelBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Include model')]")), 10000);
    await includeModelBtn.click();
    // Select the modelName from the list (implementation depends on available models in the test environment)
    const modelOption = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'pf-c-card')]//h4[text()='${modelName}']`)), 10000);
    await modelOption.click();
    const addBtn = await driver.findElement(By.xpath("//button[contains(., 'Add')]"));
    await addBtn.click();
    // Go back to Data Types
    const dataTypesTab = await driver.findElement(By.css('[data-testid="kie-tools--dmn-editor--data-types-tab"]'));
    await dataTypesTab.click();
});

When("I select the Data Type {string} from {string}", async function (typeName, modelName) {
    const filterInput = await driver.findElement(By.css('input[placeholder="Filter..."]'));
    await filterInput.sendKeys(typeName);
    const item = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${typeName}']`)), 10000);
    await item.click();
});

Then("I should see the {string} label in the Data Type Panel", async function (labelText) {
    const label = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-type-panel-header')]//span[contains(@class, 'pf-c-label') and contains(., '${labelText}')]`)), 10000);
    expect(await label.isDisplayed()).to.be.true;
});

Then("the Data Type Panel for {string} should be read-only", async function (name) {
    const description = await driver.wait(until.elementLocated(By.css('textarea[aria-label="Data type description"]')), 10000);
    expect(await description.getAttribute("disabled")).to.equal("true");
});
