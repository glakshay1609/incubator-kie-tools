import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "chai";
import { WebDriver, By, until, Key } from "selenium-webdriver";

// Assuming a world object or a static driver instance
declare const driver: WebDriver;

Given("I am in the DMN Editor's Data Types tab", async function () {
  const dataTypesTab = await driver.findElement(By.css('[data-testid="kie-tools--dmn-editor--data-types-tab"]'));
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
    5000
  );
  expect(await item.isDisplayed()).to.be.true;
});

Then("the Data Type Panel should be open for {string}", async function (name) {
  const panelTitle = await driver.findElement(By.css(".kie-dmn-editor--data-types-title"));
  expect(await panelTitle.getText()).to.contain(name);
});

Given("a Data Type named {string} exists", async function (name) {
  const items = await driver.findElements(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`));
  if (items.length === 0) {
    const addButton = await driver.findElement(By.css('[aria-label="Add Data Type"]'));
    await addButton.click();
    // Assuming it creates 'tNewDataType' by default and we rename it
    const newItem = await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='tNewDataType']")), 5000);
    await driver.actions().doubleClick(newItem).perform();
    const input = await driver.switchTo().activeElement();
    await input.sendKeys(Key.CONTROL, "a", Key.DELETE);
    await input.sendKeys(name, Key.ENTER);
  }
});

Given("the following Data Types exist:", async function (dataTable: DataTable) {
  const names = dataTable.hashes().map(row => row.name);
  for (const name of names) {
    await this.Given(`a Data Type named "${name}" exists`);
  }
});

When("I rename the Data Type {string} to {string}", async function (oldName, newName) {
  const item = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${oldName}']`));
  await driver.actions().doubleClick(item).perform();
  const input = await driver.switchTo().activeElement();
  await input.sendKeys(Key.CONTROL, "a", Key.DELETE);
  await input.sendKeys(newName, Key.ENTER);
});

Then("I should see the Data Type {string} in the list", async function (name) {
  const item = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`));
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
  await this.When("I select the Data Type {string}", name);
  const isStructSwitch = await driver.findElement(By.xpath("//label[contains(., 'Is struct?')]/../input"));
  if (!(await isStructSwitch.isSelected())) {
    await isStructSwitch.click();
  }
});

When("I select the Data Type {string}", async function (name) {
  const item = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`));
  await item.click();
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

When("I add a property named {string} to {string}", async function (propName, typeName) {
  const addPropButton = await driver.findElement(By.xpath(`//button[contains(., "Add property to '${typeName}'")]`));
  await addPropButton.click();
  const lastInput = await driver.switchTo().activeElement();
  await lastInput.sendKeys(Key.CONTROL, "a", Key.DELETE);
  await lastInput.sendKeys(propName, Key.ENTER);
});

Given("{string} has a property {string}", async function (typeName, propName) {
    await this.When("I add a property named {string} to {string}", propName, typeName);
});

Given("{string} has a property {string} which is a struct", async function (parentProp, childProp) {
    // This assumes parentProp is already in the table
    const row = await driver.findElement(By.xpath(`//tr[contains(., '${parentProp}')]`));
    const isStructSwitch = await row.findElement(By.css('input[aria-label="Is struct?"]'));
    if (!(await isStructSwitch.isSelected())) {
        await isStructSwitch.click();
    }
    const addPropButton = await row.findElement(By.css('button[title="Add item component"]'));
    await addPropButton.click();
    const lastInput = await driver.switchTo().activeElement();
    await lastInput.sendKeys(Key.CONTROL, "a", Key.DELETE);
    await lastInput.sendKeys(childProp, Key.ENTER);
});

Then("{string} should have a property {string}", async function (typeName, propName) {
  const propertyRow = await driver.findElement(By.xpath(`//table//span[text()='${propName}']`));
  expect(await propertyRow.isDisplayed()).to.be.true;
});

When("I set a {word} constraint with value {string}", async function (constraintType, value) {
  const toggleButton = await driver.findElement(By.id(constraintType));
  await toggleButton.click();

  if (constraintType === "Enumeration") {
    const addButton = await driver.findElement(By.xpath("//button[contains(., 'Add')]"));
    await addButton.click();
    const input = await driver.switchTo().activeElement();
    await input.sendKeys(value, Key.ENTER);
  } else if (constraintType === "Expression") {
    const textArea = await driver.findElement(By.css(".kie-dmn-editor--constraints-expression textarea"));
    await textArea.sendKeys(value);
  } else if (constraintType === "Range") {
      // Assuming value is like [1..10]
      const rangeParts = value.match(/([\[\(])(.+)\.\.(.+)([\]\)])/);
      if (rangeParts) {
          const [_, startBracket, start, end, endBracket] = rangeParts;
          // Logic to interact with Range components (dropdowns and inputs)
          const startInclude = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-start-include'));
          await startInclude.click();
          const startIncludeOption = await driver.findElement(By.xpath(`//li[contains(., '${startBracket === "[" ? "Include" : "Exclude"}')]`));
          await startIncludeOption.click();

          const startInput = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-start-value input'));
          await startInput.sendKeys(start);

          const endInput = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-end-value input'));
          await endInput.sendKeys(end);

          const endInclude = await driver.findElement(By.css('.kie-dmn-editor--constraints-range-end-include'));
          await endInclude.click();
          const endIncludeOption = await driver.findElement(By.xpath(`//li[contains(., '${endBracket === "]" ? "Include" : "Exclude"}')]`));
          await endIncludeOption.click();
      }
  }
});

Then("the Data Type {string} should have the constraint {string}", async function (name, value) {
  const body = await driver.findElement(By.css("body")).getText();
  expect(body).to.contain(value);
});

When("I delete the Data Type {string}", async function (name) {
  const kebab = await driver.findElement(By.id("toggle-kebab-top-level"));
  await kebab.click();
  const removeButton = await driver.findElement(By.xpath("//button[contains(., 'Remove')]"));
  await removeButton.click();
});

When("I filter the Data Types list with {string}", async function (filterText) {
  const filterInput = await driver.findElement(By.css('input[placeholder="Filter..."]'));
  await filterInput.sendKeys(filterText);
});

When("I copy the Data Type {string}", async function (name) {
  const kebab = await driver.findElement(By.id("toggle-kebab-top-level"));
  await kebab.click();
  const copyButton = await driver.findElement(By.xpath("//button[contains(., 'Copy')]"));
  await copyButton.click();
});

When("I paste the Data Type", async function () {
  const addKebab = await driver.findElement(By.id("add-data-type-toggle"));
  await addKebab.click();
  const pasteButton = await driver.findElement(By.xpath("//button[contains(., 'Paste')]"));
  await pasteButton.click();
});

When("I extract the property {string} from {string} to a top-level Data Type", async function (propName, structName) {
  const propKebab = await driver.findElement(By.xpath(`//tr[contains(., '${propName}')]//button[contains(@id, 'toggle-kebab')]`));
  await propKebab.click();
  const extractButton = await driver.findElement(By.xpath("//button[contains(., 'Extract data type')]"));
  await extractButton.click();
});

Then("a new Data Type named {string} should exist", async function (name) {
    const item = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${name}']`));
    expect(await item.isDisplayed()).to.be.true;
});

Then("the property {string} of {string} should have type {string}", async function (propName, structName, typeName) {
    const propRow = await driver.findElement(By.xpath(`//tr[contains(., '${propName}')]`));
    const typeLabel = await propRow.findElement(By.className("kie-dmn-editor--type-ref-label"));
    expect(await typeLabel.getText()).to.equal(typeName);
});

When("I expand the property {string}", async function (propName) {
  const expandButton = await driver.findElement(By.xpath(`//tr[contains(., '${propName}')]//button[@title='Expand / collapse item component']`));
  const icon = await expandButton.findElement(By.css("svg"));
  const iconClass = await icon.getAttribute("class");
  if (iconClass.includes("angle-right")) {
      await expandButton.click();
  }
});

When("I collapse the property {string}", async function (propName) {
    const expandButton = await driver.findElement(By.xpath(`//tr[contains(., '${propName}')]//button[@title='Expand / collapse item component']`));
    const icon = await expandButton.findElement(By.css("svg"));
    const iconClass = await icon.getAttribute("class");
    if (iconClass.includes("angle-down")) {
        await expandButton.click();
    }
});

Then("I should see the property {string}", async function (propName) {
    const prop = await driver.findElement(By.xpath(`//table//span[text()='${propName}']`));
    expect(await prop.isDisplayed()).to.be.true;
});

Then("I should not see the property {string}", async function (propName) {
    const props = await driver.findElements(By.xpath(`//table//span[text()='${propName}']`));
    if (props.length > 0) {
        expect(await props[0].isDisplayed()).to.be.false;
    }
});

Given("an external model named {string} with a Data Type {string} is imported", async function (modelName, typeName) {
    // Logic to simulate an imported model with a data type
    // This might involve navigating to 'Included Models' or assuming it's already there for the test
});

When("I select the Data Type {string} from {string}", async function (typeName, modelName) {
    const filterInput = await driver.findElement(By.css('input[placeholder="Filter..."]'));
    await filterInput.sendKeys(typeName);
    const item = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='${typeName}']`));
    await item.click();
});

Then("I should see the {string} label in the Data Type Panel", async function (labelText) {
    const label = await driver.findElement(By.xpath(`//div[contains(@class, 'kie-dmn-editor--data-type-panel-header')]//span[contains(@class, 'pf-c-label') and contains(., '${labelText}')]`));
    expect(await label.isDisplayed()).to.be.true;
});

Then("the Data Type Panel for {string} should be read-only", async function (name) {
    const description = await driver.findElement(By.css('textarea[aria-label="Data type description"]'));
    expect(await description.getAttribute("disabled")).to.equal("true");
});
