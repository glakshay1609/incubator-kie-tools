/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
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

import { DMN_LATEST__tItemDefinition } from "@kie-tools/dmn-marshaller";
import { Normalized } from "@kie-tools/dmn-marshaller/dist/normalization/normalize";
import { isStruct } from "./DataTypeSpec";
import { DataType, DataTypeIndex } from "./DataTypes";

export function createDefaultInstance(
  itemDefinition: Normalized<DMN_LATEST__tItemDefinition>,
  allDataTypesByFeelName: Map<string, DataType>
): Record<string, any> | undefined {
  const typeRef = itemDefinition.typeRef?.__$$text;
  if (!typeRef) {
    return undefined;
  }

  const referencedDataType = allDataTypesByFeelName.get(typeRef);
  if (!referencedDataType || !isStruct(referencedDataType.itemDefinition)) {
    return undefined;
  }

  const defaultInstance: Record<string, any> = {};
  for (const comp of referencedDataType.itemDefinition.itemComponent ?? []) {
    defaultInstance[comp["@_name"]] = createDefaultInstance(comp, allDataTypesByFeelName);
  }
  return defaultInstance;
}
