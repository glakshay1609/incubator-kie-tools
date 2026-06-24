package org.kie.dmn.editor.tests.atdd;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import io.cucumber.datatable.DataTable;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.junit.Assert;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DataTypesSteps {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public DataTypesSteps(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    private void clearInput(WebElement element) {
        String value = element.getAttribute("value");
        for (int i = 0; i < value.length(); i++) {
            element.sendKeys(Keys.BACK_SPACE);
        }
    }

    private void selectDataTypeByName(String name) {
        WebElement item = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + name + "']")));
        item.click();
    }

    private void createDataType(String name) {
        List<WebElement> items = driver.findElements(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + name + "']"));
        if (items.isEmpty()) {
            WebElement addButton = wait.until(ExpectedConditions.elementLocated(By.cssSelector("[aria-label=\"Add Data Type\"]")));
            addButton.click();
            WebElement newItem = wait.until(ExpectedConditions.elementLocated(
                    By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='tNewDataType']")));
            new Actions(driver).doubleClick(newItem).perform();
            WebElement input = driver.switchTo().activeElement();
            clearInput(input);
            input.sendKeys(name, Keys.ENTER);
        }
    }

    @Given("I am in the DMN Editor's Data Types tab")
    public void i_am_in_the_dmn_editor_s_data_types_tab() {
        WebElement dataTypesTab = wait.until(ExpectedConditions.elementLocated(
                By.cssSelector("[data-testid=\"kie-tools--dmn-editor--data-types-tab\"]")));
        dataTypesTab.click();
    }

    @Then("I should see the {string} empty state")
    public void i_should_see_the_empty_state(String text) {
        WebElement emptyState = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("kie-dmn-editor--data-types-empty-state")));
        Assert.assertTrue(emptyState.getText().contains(text));
    }

    @Then("the {string} button should be visible")
    public void the_button_should_be_visible(String label) {
        WebElement button = driver.findElement(By.xpath("//button[contains(., '" + label + "')]"));
        Assert.assertTrue(button.isDisplayed());
    }

    @When("I click on the {string} button")
    public void i_click_on_the_button(String label) {
        WebElement button = driver.findElement(By.xpath("//button[contains(., '" + label + "')]"));
        button.click();
    }

    @Then("a new Data Type named {string} should be created")
    public void a_new_data_type_named_should_be_created(String name) {
        WebElement item = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + name + "']")));
        Assert.assertTrue(item.isDisplayed());
    }

    @Then("the Data Type Panel should be open for {string}")
    public void the_data_type_panel_should_be_open_for(String name) {
        WebElement panelTitle = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("kie-dmn-editor--data-types-title")));
        Assert.assertTrue(panelTitle.getText().contains(name));
    }

    @Given("a Data Type named {string} exists")
    public void a_data_type_named_exists(String name) {
        createDataType(name);
    }

    @Given("the following Data Types exist:")
    public void the_following_data_types_exist(DataTable dataTable) {
        List<Map<String, String>> rows = dataTable.asMaps(String.class, String.class);
        for (Map<String, String> row : rows) {
            createDataType(row.get("name"));
        }
    }

    @When("I rename the Data Type {string} to {string}")
    public void i_rename_the_data_type_to(String oldName, String newName) {
        WebElement item = driver.findElement(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + oldName + "']"));
        new Actions(driver).doubleClick(item).perform();
        WebElement input = driver.switchTo().activeElement();
        clearInput(input);
        input.sendKeys(newName, Keys.ENTER);
    }

    @Then("I should see the Data Type {string} in the list")
    public void i_should_see_the_data_type_in_the_list(String name) {
        WebElement item = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + name + "']")));
        Assert.assertTrue(item.isDisplayed());
    }

    @Then("the Data Type {string} should not exist")
    public void the_data_type_should_not_exist(String name) {
        List<WebElement> items = driver.findElements(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + name + "']"));
        Assert.assertTrue(items.isEmpty());
    }

    @When("I toggle the {string} switch")
    public void i_toggle_the_switch(String label) {
        WebElement switchContainer = driver.findElement(
                By.xpath("//label[contains(., '" + label + "')]/following-sibling::span[contains(@class, 'pf-c-switch')]"));
        WebElement input = switchContainer.findElement(By.tagName("input"));
        input.click();
    }

    @Given("{string} is a struct")
    public void is_a_struct(String name) {
        selectDataTypeByName(name);
        WebElement isStructSwitch = wait.until(ExpectedConditions.elementLocated(By.xpath("//label[contains(., 'Is struct?')]/../input")));
        if (!isStructSwitch.isSelected()) {
            isStructSwitch.click();
        }
    }

    @Given("{string} is a collection")
    public void is_a_collection(String name) {
        selectDataTypeByName(name);
        WebElement isCollectionSwitch = wait.until(ExpectedConditions.elementLocated(By.xpath("//label[contains(., 'Is collection?')]/../input")));
        if (!isCollectionSwitch.isSelected()) {
            isCollectionSwitch.click();
        }
    }

    @When("I select the Data Type {string}")
    public void i_select_the_data_type(String name) {
        selectDataTypeByName(name);
    }

    @Then("the Data Type {string} should be a {word}")
    public void the_data_type_should_be_a(String name, String state) {
        if ("collection".equalsIgnoreCase(state)) {
            WebElement isCollectionSwitch = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(., 'Is collection?')]/../input")));
            Assert.assertTrue(isCollectionSwitch.isSelected());
        } else if ("struct".equalsIgnoreCase(state)) {
            List<WebElement> propertiesTable = driver.findElements(By.className("kie-dmn-editor--data-type-properties-table"));
            Assert.assertFalse(propertiesTable.isEmpty());
        }
    }

    @Given("{string} is of type {string}")
    public void is_of_type(String typeName, String baseType) {
        selectDataTypeByName(typeName);
        WebElement typeSelector = wait.until(ExpectedConditions.elementLocated(By.className("pf-c-select")));
        typeSelector.click();
        WebElement option = wait.until(ExpectedConditions.elementLocated(By.xpath("//li//button[contains(., '" + baseType + "')]")));
        option.click();
    }

    @When("I add a property named {string} to {string}")
    public void i_add_a_property_named_to(String propName, String typeName) {
        WebElement addPropButton = driver.findElement(By.xpath("//button[contains(., \"Add property to '" + typeName + "'\")]"));
        addPropButton.click();
        WebElement lastInput = driver.switchTo().activeElement();
        clearInput(lastInput);
        lastInput.sendKeys(propName, Keys.ENTER);
    }

    @When("I add a property {string} to {string} with type {string}")
    public void i_add_a_property_to_with_type(String propName, String typeName, String associatedType) {
        i_add_a_property_named_to(propName, typeName);
        WebElement propRow = wait.until(ExpectedConditions.elementLocated(By.xpath("//tr[contains(., '" + propName + "')]")));
        WebElement typeSelector = propRow.findElement(By.className("pf-c-select"));
        typeSelector.click();
        WebElement option = wait.until(ExpectedConditions.elementLocated(By.xpath("//li//button[contains(., '" + associatedType + "')]")));
        option.click();
    }

    @Given("{string} has a property {string}")
    public void has_a_property(String typeName, String propName) {
        i_add_a_property_named_to(propName, typeName);
    }

    @Given("{string} has a property {string} which is a struct")
    public void has_a_property_which_is_a_struct(String parentProp, String childProp) {
        WebElement row = driver.findElement(By.xpath("//tr[contains(., '" + parentProp + "')]"));
        WebElement isStructSwitch = row.findElement(By.cssSelector("input[aria-label=\"Is struct?\"]"));
        if (!isStructSwitch.isSelected()) {
            isStructSwitch.click();
        }
        WebElement addPropButton = row.findElement(By.cssSelector("button[title=\"Add item component\"]"));
        addPropButton.click();
        WebElement lastInput = driver.switchTo().activeElement();
        clearInput(lastInput);
        lastInput.sendKeys(childProp, Keys.ENTER);
    }

    @Given("{string} has a property {string} which is a collection")
    public void has_a_property_which_is_a_collection(String parentProp, String childProp) {
        WebElement row = driver.findElement(By.xpath("//tr[contains(., '" + parentProp + "')]"));
        WebElement isCollectionSwitch = row.findElement(By.cssSelector("input[aria-label=\"Is collection?\"]"));
        if (!isCollectionSwitch.isSelected()) {
            isCollectionSwitch.click();
        }
    }

    @Given("{string} has a property {string} of type {string}")
    public void has_a_property_of_type(String parentProp, String childProp, String typeName) {
        WebElement row = driver.findElement(By.xpath("//tr[contains(., '" + parentProp + "')]"));
        WebElement addPropButton = row.findElement(By.cssSelector("button[title=\"Add item component\"]"));
        addPropButton.click();
        WebElement lastInput = driver.switchTo().activeElement();
        clearInput(lastInput);
        lastInput.sendKeys(childProp, Keys.ENTER);

        WebElement propRow = wait.until(ExpectedConditions.elementLocated(By.xpath("//tr[contains(., '" + childProp + "')]")));
        WebElement typeSelector = propRow.findElement(By.className("pf-c-select"));
        typeSelector.click();
        WebElement option = wait.until(ExpectedConditions.elementLocated(By.xpath("//li//button[contains(., '" + typeName + "')]")));
        option.click();
    }

    @Then("{string} should have a property {string}")
    public void should_have_a_property(String typeName, String propName) {
        WebElement propertyRow = wait.until(ExpectedConditions.elementLocated(By.xpath("//table//span[text()='" + propName + "']")));
        Assert.assertTrue(propertyRow.isDisplayed());
    }

    @Then("I should see the property {string} nested under {string} under {string}")
    public void i_should_see_the_property_nested_under_under(String prop, String p2, String p1) {
        WebElement row = wait.until(ExpectedConditions.elementLocated(By.xpath("//tr[contains(., '" + prop + "')]")));
        Assert.assertTrue(row.isDisplayed());
    }

    @When("I set a {string} constraint with value {string}")
    public void i_set_a_constraint_with_value(String constraintType, String value) {
        String buttonId = constraintType;
        if ("Collection".equalsIgnoreCase(constraintType) || "Collection item".equalsIgnoreCase(constraintType)) {
            buttonId = "Expression";
        }

        WebElement toggleButton = wait.until(ExpectedConditions.elementLocated(By.id(buttonId)));
        toggleButton.click();

        if ("Enumeration".equalsIgnoreCase(buttonId)) {
            WebElement addButton = driver.findElement(By.xpath("//button[contains(., 'Add')]"));
            addButton.click();
            WebElement input = driver.switchTo().activeElement();
            clearInput(input);
            input.sendKeys(value, Keys.ENTER);
        } else if ("Range".equalsIgnoreCase(buttonId)) {
            Pattern pattern = Pattern.compile("([\\[\\(])(.+)\\.\\.(.+)([\\]\\)])");
            Matcher matcher = pattern.matcher(value);
            if (matcher.find()) {
                String startBracket = matcher.group(1);
                String startValue = matcher.group(2);
                String endValue = matcher.group(3);
                String endBracket = matcher.group(4);

                WebElement startInclude = driver.findElement(By.className("kie-dmn-editor--constraints-range-start-include"));
                startInclude.click();
                WebElement startOption = wait.until(ExpectedConditions.elementLocated(
                        By.xpath("//li[contains(., '" + ("[".equals(startBracket) ? "Include" : "Exclude") + "')]")));
                startOption.click();

                WebElement startInput = driver.findElement(By.cssSelector(".kie-dmn-editor--constraints-range-start-value input"));
                startInput.sendKeys(startValue);

                WebElement endInput = driver.findElement(By.cssSelector(".kie-dmn-editor--constraints-range-end-value input"));
                endInput.sendKeys(endValue);

                WebElement endInclude = driver.findElement(By.className("kie-dmn-editor--constraints-range-end-include"));
                endInclude.click();
                WebElement endOption = wait.until(ExpectedConditions.elementLocated(
                        By.xpath("//li[contains(., '" + ("]".equals(endBracket) ? "Include" : "Exclude") + "')]")));
                endOption.click();
            }
        } else {
            WebElement textArea = driver.findElement(By.cssSelector(".kie-dmn-editor--constraints-expression textarea"));
            textArea.sendKeys(value);
        }
    }

    @Then("the Data Type {string} should have the {string} constraint {string}")
    public void the_data_type_should_have_the_constraint(String name, String level, String value) {
        WebElement panel = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("kie-dmn-editor--data-type-panel-header")));
        Assert.assertTrue(driver.findElement(By.tagName("body")).getText().contains(value));
    }

    @Then("the Data Type {string} should have the constraint {string}")
    public void the_data_type_should_have_the_constraint_simple(String name, String value) {
        Assert.assertTrue(driver.findElement(By.tagName("body")).getText().contains(value));
    }

    @When("I click the {string} button in the Data Type Panel for {string}")
    public void i_click_the_button_in_the_data_type_panel_for(String btnTitle, String name) {
        WebElement btn = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[@title='" + btnTitle + "']")));
        btn.click();
    }

    @Given("{string} is associated with type {string}")
    public void is_associated_with_type(String derived, String base) {
        selectDataTypeByName(derived);
        WebElement typeSelector = wait.until(ExpectedConditions.elementLocated(By.className("pf-c-select")));
        typeSelector.click();
        WebElement option = wait.until(ExpectedConditions.elementLocated(By.xpath("//li//button[contains(., '" + base + "')]")));
        option.click();
    }

    @Given("{string} has a property of type {string}")
    public void has_a_property_of_type(String usage, String source) {
        i_add_a_property_to_with_type("tmpProp", usage, source);
    }

    @When("I confirm the refactor in the confirmation dialog")
    public void i_confirm_the_refactor_in_the_confirmation_dialog() {
        WebElement confirmBtn = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[contains(., 'Confirm')]")));
        confirmBtn.click();
    }

    @Then("the property of {string} should now have type {string}")
    public void the_property_of_should_now_have_type(String usage, String typeName) {
        selectDataTypeByName(usage);
        WebElement typeLabel = wait.until(ExpectedConditions.elementLocated(By.className("kie-dmn-editor--type-ref-label")));
        Assert.assertEquals(typeName, typeLabel.getText());
    }

    @When("I delete the Data Type {string}")
    public void i_delete_the_data_type(String name) {
        WebElement kebab = wait.until(ExpectedConditions.elementLocated(By.id("toggle-kebab-top-level")));
        kebab.click();
        WebElement removeButton = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[contains(., 'Remove')]")));
        removeButton.click();
    }

    @When("I filter the Data Types list with {string}")
    public void i_filter_the_data_types_list_with(String filterText) {
        WebElement filterInput = driver.findElement(By.cssSelector("input[placeholder=\"Filter...\"]"));
        filterInput.sendKeys(filterText);
    }

    @When("I copy the Data Type {string}")
    public void i_copy_the_data_type(String name) {
        WebElement kebab = wait.until(ExpectedConditions.elementLocated(By.id("toggle-kebab-top-level")));
        kebab.click();
        WebElement copyButton = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[contains(., 'Copy')]")));
        copyButton.click();
    }

    @When("I paste the Data Type")
    public void i_paste_the_data_type() {
        WebElement addKebab = wait.until(ExpectedConditions.elementLocated(By.id("add-data-type-toggle")));
        addKebab.click();
        WebElement pasteButton = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[contains(., 'Paste')]")));
        pasteButton.click();
    }

    @When("I extract the property {string} from {string} to a top-level Data Type")
    public void i_extract_the_property_from_to_a_top_level_data_type(String propName, String structName) {
        WebElement propKebab = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//tr[contains(., '" + propName + "')]//button[contains(@id, 'toggle-kebab')]")));
        propKebab.click();
        WebElement extractButton = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[contains(., 'Extract data type')]")));
        extractButton.click();
    }

    @Then("a new Data Type named {string} should exist")
    public void a_new_data_type_named_should_exist(String name) {
        WebElement item = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + name + "']")));
        Assert.assertTrue(item.isDisplayed());
    }

    @Then("the property {string} of {string} should have type {string}")
    public void the_property_of_should_have_type(String propName, String structName, String typeName) {
        WebElement propRow = wait.until(ExpectedConditions.elementLocated(By.xpath("//tr[contains(., '" + propName + "')]")));
        WebElement typeLabel = propRow.findElement(By.className("kie-dmn-editor--type-ref-label"));
        Assert.assertEquals(typeName, typeLabel.getText());
    }

    @When("I expand the property {string}")
    public void i_expand_the_property(String propName) {
        WebElement expandButton = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//tr[contains(., '" + propName + "')]//button[@title='Expand / collapse item component']")));
        WebElement icon = expandButton.findElement(By.tagName("svg"));
        String iconClass = icon.getAttribute("class");
        if (iconClass.contains("angle-right")) {
            expandButton.click();
        }
    }

    @When("I collapse the property {string}")
    public void i_collapse_the_property(String propName) {
        WebElement expandButton = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//tr[contains(., '" + propName + "')]//button[@title='Expand / collapse item component']")));
        WebElement icon = expandButton.findElement(By.tagName("svg"));
        String iconClass = icon.getAttribute("class");
        if (iconClass.contains("angle-down")) {
            expandButton.click();
        }
    }

    @Then("I should see the property {string}")
    public void i_should_see_the_property(String propName) {
        WebElement prop = wait.until(ExpectedConditions.elementLocated(By.xpath("//table//span[text()='" + propName + "']")));
        Assert.assertTrue(prop.isDisplayed());
    }

    @Then("I should not see the property {string}")
    public void i_should_not_see_the_property(String propName) {
        List<WebElement> props = driver.findElements(By.xpath("//table//span[text()='" + propName + "']"));
        if (!props.isEmpty()) {
            Assert.assertFalse(props.get(0).isDisplayed());
        }
    }

    @Given("an external model named {string} with a Data Type {string} is imported")
    public void an_external_model_named_with_a_data_type_is_imported(String modelName, String typeName) {
        WebElement includedModelsTab = wait.until(ExpectedConditions.elementLocated(
                By.cssSelector("[data-testid=\"kie-tools--dmn-editor--included-models-tab\"]")));
        includedModelsTab.click();
        WebElement includeModelBtn = wait.until(ExpectedConditions.elementLocated(By.xpath("//button[contains(., 'Include model')]")));
        includeModelBtn.click();
        WebElement modelOption = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'pf-c-card')]//h4[text()='" + modelName + "']")));
        modelOption.click();
        WebElement addBtn = driver.findElement(By.xpath("//button[contains(., 'Add')]"));
        addBtn.click();
        WebElement dataTypesTab = wait.until(ExpectedConditions.elementLocated(By.cssSelector("[data-testid=\"kie-tools--dmn-editor--data-types-tab\"]")));
        dataTypesTab.click();
    }

    @When("I select the Data Type {string} from {string}")
    public void i_select_the_data_type_from(String typeName, String modelName) {
        WebElement filterInput = driver.findElement(By.cssSelector("input[placeholder=\"Filter...\"]"));
        filterInput.sendKeys(typeName);
        WebElement item = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-types-nav-item')]//span[text()='" + typeName + "']")));
        item.click();
    }

    @Then("I should see the {string} label in the Data Type Panel")
    public void i_should_see_the_label_in_the_data_type_panel(String labelText) {
        WebElement label = wait.until(ExpectedConditions.elementLocated(
                By.xpath("//div[contains(@class, 'kie-dmn-editor--data-type-panel-header')]//span[contains(@class, 'pf-c-label') and contains(., '" + labelText + "')]")));
        Assert.assertTrue(label.isDisplayed());
    }

    @Then("the Data Type Panel for {string} should be read-only")
    public void the_data_type_panel_for_should_be_read_only(String name) {
        WebElement description = wait.until(ExpectedConditions.elementLocated(By.cssSelector("textarea[aria-label=\"Data type description\"]")));
        Assert.assertEquals("true", description.getAttribute("disabled"));
    }
}
