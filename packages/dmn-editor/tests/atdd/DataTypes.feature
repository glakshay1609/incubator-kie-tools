Feature: DMN Editor - Data Types

  Background:
    Given I am in the DMN Editor's Data Types tab

  Scenario: Initial empty state
    Then I should see the "No Data Types" empty state
    And the "Add Data Type" button should be visible

  Scenario: Add a new top-level Data Type
    When I click on the "Add Data Type" button
    Then a new Data Type named "tNewDataType" should be created
    And the Data Type Panel should be open for "tNewDataType"

  Scenario: Rename a Data Type
    Given a Data Type named "tOriginalName" exists
    When I rename the Data Type "tOriginalName" to "tRenamedName"
    Then I should see the Data Type "tRenamedName" in the list
    And the Data Type "tOriginalName" should not exist

  Scenario Outline: Toggle Data Type properties
    Given a Data Type named "tTestType" exists
    When I toggle the "<property>" switch
    Then the Data Type "tTestType" should be a <state>
    Examples:
      | property      | state      |
      | Is collection? | collection |
      | Is struct?     | struct     |

  Scenario: Add a property to a struct Data Type
    Given a Data Type named "tStructType" exists
    And "tStructType" is a struct
    When I add a property named "newProperty" to "tStructType"
    Then "tStructType" should have a property "newProperty"

  Scenario Outline: Set constraints on a Data Type
    Given a Data Type named "tConstrainedType" exists
    And "tConstrainedType" is of type "<type>"
    When I set a <constraint_type> constraint with value "<value>"
    Then the Data Type "tConstrainedType" should have the constraint "<value>"
    Examples:
      | type   | constraint_type | value              |
      | string | Enumeration     | "A", "B", "C"      |
      | number | Range           | [1..10]            |
      | number | Expression      | < 100              |

  Scenario: Delete a Data Type
    Given a Data Type named "tToDelete" exists
    When I delete the Data Type "tToDelete"
    Then the Data Type "tToDelete" should not exist in the list

  Scenario: Filter Data Types
    Given the following Data Types exist:
      | name    |
      | tPerson |
      | tAddress|
      | tOrder  |
    When I filter the Data Types list with "Person"
    Then I should see "tPerson" in the list
    And I should not see "tAddress" in the list
    And I should not see "tOrder" in the list

  Scenario: Copy and Paste a Data Type
    Given a Data Type named "tSource" exists
    When I copy the Data Type "tSource"
    And I paste the Data Type
    Then a new Data Type named "tSource" should be created

  Scenario: Extract a property to a top-level Data Type
    Given a Data Type named "tStruct" exists
    And "tStruct" is a struct
    And "tStruct" has a property "tProperty"
    When I extract the property "tProperty" from "tStruct" to a top-level Data Type
    Then a new Data Type named "ttProperty" should exist
    And the property "tProperty" of "tStruct" should have type "ttProperty"

  Scenario: Expand and collapse nested properties
    Given a Data Type named "tNestedStruct" exists
    And "tNestedStruct" is a struct
    And "tNestedStruct" has a property "level1" which is a struct
    And "level1" has a property "level2"
    When I expand the property "level1"
    Then I should see the property "level2"
    When I collapse the property "level1"
    Then I should not see the property "level2"

  Scenario: View an external Data Type
    Given an external model named "ExternalModel" with a Data Type "tExternalType" is imported
    When I select the Data Type "tExternalType" from "ExternalModel"
    Then I should see the "External" label in the Data Type Panel
    And the Data Type Panel for "tExternalType" should be read-only

  Scenario: Associate a custom Data Type to another
    Given a Data Type named "tAddress" exists
    And a Data Type named "tEmployee" exists
    And "tEmployee" is a struct
    When I add a property "address" to "tEmployee" with type "tAddress"
    Then the property "address" of "tEmployee" should have type "tAddress"

  Scenario: Complex nesting of Data Types
    Given a Data Type named "tCompany" exists
    And "tCompany" is a struct
    And "tCompany" has a property "departments" which is a collection
    And "tCompany" has a property "departments" which is a struct
    And "departments" has a property "manager" which is a struct
    And "manager" has a property "name" of type "string"
    Then I should see the property "name" nested under "manager" under "departments"

  Scenario Outline: Collection constraints vs Collection item constraints
    Given a Data Type named "tScores" exists
    And "tScores" is a collection
    And "tScores" is of type "number"
    When I set a <level> constraint with value "<value>"
    Then the Data Type "tScores" should have the <level> constraint "<value>"
    Examples:
      | level          | value    |
      | Collection     | [1..100] |
      | Collection item| > 0      |

  Scenario: Jump to definition of an associated Data Type
    Given a Data Type named "tBase" exists
    And a Data Type named "tDerived" exists
    And "tDerived" is associated with type "tBase"
    When I click the "Jump to definition" button in the Data Type Panel for "tDerived"
    Then the Data Type Panel should be open for "tBase"

  Scenario: Cascade rename when refactoring a Data Type name
    Given a Data Type named "tSourceType" exists
    And a Data Type named "tUsageType" exists
    And "tUsageType" has a property of type "tSourceType"
    When I rename the Data Type "tSourceType" to "tNewType"
    And I confirm the refactor in the confirmation dialog
    Then the property of "tUsageType" should now have type "tNewType"
