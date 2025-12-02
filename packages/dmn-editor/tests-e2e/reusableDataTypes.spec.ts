/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { test, expect } from "@playwright/test";
import {
  SAMPLES_SOURCE_CODE,
  START_EDITING_GOTO_URL_TEMPLATE,
  STOP_EDITING_GOTO_URL,
} from "e2e--testing-assets/constants";
import {
  assertCsvIsEqual,
  assertExcelIsEqual,
  assertFileIsDownloaded,
  assertFileIsUploaded,
  assertIsCsv,
  assertIsExcel,
  assertIsPng,
  assertIsPmml,
  assertIsSvg,
  clickAndAssertThatItWasClicked,
  dragAndDrop,
  dragAndDropThenResize,
  hoverThenClick,
  pressEscape,
  scroll,
  screenshot,
  select,
  testOnModel,
  waitFor,
} from "e2e--testing-assets/utils";

test.beforeEach(async ({ page }) => {
  await page.goto(START_EDITING_GOTO_URL_TEMPLATE.replace("{sample}", "base"));
});

test.describe("Reusable Data Types", () => {
  test("it should be possible to make an inline struct reusable", async ({ page }) => {
    // Open the Data Types tab
    await page.getByRole("tab", { name: "Data Types" }).click();

    // Add a new Data Type
    await page.getByRole("button", { name: "Add Data Type" }).click();

    // Rename the Data Type
    await page.getByPlaceholder("Enter a name...").click();
    await page.getByPlaceholder("Enter a name...").fill("customer");
    await page.getByPlaceholder("Enter a name...").press("Enter");

    // Make the Data Type a struct
    await page.getByLabel("Is struct?").click();

    // Add a new property
    await page.getByRole("button", { name: "Add item component (at the top)" }).click();

    // Rename the property
    await page.getByPlaceholder("New property").click();
    await page.getByPlaceholder("New property").fill("employment_detail");
    await page.getByPlaceholder("New property").press("Enter");

    // Make the property a struct
    await page.locator("tbody").getByLabel("Is struct?").click();

    // Add a new property to the nested struct
    await page.getByRole("button", { name: "Add item component" }).click();

    // Rename the nested property
    await page.getByPlaceholder("New property").click();
    await page.getByPlaceholder("New property").fill("startDate");
    await page.getByPlaceholder("New property").press("Enter");

    // Make the nested struct reusable
    await page.getByRole("button", { name: "Make reusable" }).click();

    // Check that the new data type is listed
    await expect(page.getByText("temployment_detail")).toBeVisible();

    // Check that the original property is now of the new type
    await expect(page.getByText("temployment_detail")).toBeVisible();
  });
});
