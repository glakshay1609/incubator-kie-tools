<!--
   Licensed to the Apache Software Foundation (ASF) under one
   or more contributor license agreements.  See the NOTICE file
   distributed with this work for additional information
   regarding copyright ownership.  The ASF licenses this file
   to you under the Apache License, Version 2.0 (the
   "License"); you may not use this file except in compliance
   with the License.  You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing,
   software distributed under the License is distributed on an
   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
   KIND, either express or implied.  See the License for the
   specific language governing permissions and limitations
   under the License.
-->

## **THIS IS A WORK IN PROGRESS**

The code within this package is for a PMML Scorecard editor.

It is considered a prototype.

Code herein is subject to change without notice.

Nothing should be considered concrete at this point.

### Usage

The PMML Editor is provided as a React component. Unlike the DMN Standalone editor, it can be embedded directly into a `div` without an `iframe` when used within a React application.

#### Installation

```bash
pnpm install @kie-tools/pmml-editor
```

#### Integration

To use the editor in your React application, import the `PMMLEditor` component. You can capture the editor instance using the `exposing` prop to interact with it programmatically (e.g., to get or set content).

```tsx
import React, { useRef, useCallback } from 'react';
import { PMMLEditor } from '@kie-tools/pmml-editor';
import "@patternfly/react-core/dist/styles/base.css";

const MyPMMLEditorPage = ({ initialXml, isNew = false }) => {
  const editorRef = useRef<PMMLEditor | null>(null);

  // This is called when the editor component is ready
  const onReady = useCallback(() => {
    if (editorRef.current) {
      if (isNew) {
        // Create a new model by passing an empty string
        editorRef.current.setContent("new-file.pmml", "");
      } else {
        // Edit an existing model
        editorRef.current.setContent("existing-file.pmml", initialXml || "");
      }
    }
  }, [initialXml, isNew]);

  const saveContent = async () => {
    if (editorRef.current) {
      const xml = await editorRef.current.getContent();
      console.log("Saved XML:", xml);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px" }}>
        <button onClick={saveContent}>Save</button>
      </div>
      <div style={{ flexGrow: 1 }}>
        <PMMLEditor
          exposing={(instance) => (editorRef.current = instance)}
          ready={onReady}
          newEdit={(edit) => console.log("New edit:", edit)}
          setNotifications={(path, notifications) => console.log("Validation:", notifications)}
        />
      </div>
    </div>
  );
};
```

#### Props

| Prop | Description |
| --- | --- |
| `exposing` | Callback that provides the `PMMLEditor` instance. |
| `ready` | Callback triggered when the component is mounted and ready. |
| `newEdit` | Triggered whenever a change is made in the editor. |
| `setNotifications` | Provides real-time validation feedback (errors and warnings). |

#### Instance API

The instance obtained via the `exposing` prop provides the following methods:

| Method | Description |
| --- | --- |
| `setContent(path: string, content: string)` | Sets the editor content. Pass `""` for a new model. |
| `getContent(): Promise<string>` | Returns the current PMML XML. |
| `undo(): Promise<void>` | Reverts the last change. |
| `redo(): Promise<void>` | Re-applies the last undone change. |
| `validate(): Notification[]` | Returns the current list of validation notifications. |

### Development

In order to run the development webapp:

`pnpm start`

---

Apache KIE (incubating) is an effort undergoing incubation at The Apache Software
Foundation (ASF), sponsored by the name of Apache Incubator. Incubation is
required of all newly accepted projects until a further review indicates that
the infrastructure, communications, and decision making process have stabilized
in a manner consistent with other successful ASF projects. While incubation
status is not necessarily a reflection of the completeness or stability of the
code, it does indicate that the project has yet to be fully endorsed by the ASF.

Some of the incubating project’s releases may not be fully compliant with ASF
policy. For example, releases may have incomplete or un-reviewed licensing
conditions. What follows is a list of known issues the project is currently
aware of (note that this list, by definition, is likely to be incomplete):

- Hibernate, an LGPL project, is being used. Hibernate is in the process of
  relicensing to ASL v2
- Some files, particularly test files, and those not supporting comments, may
  be missing the ASF Licensing Header

If you are planning to incorporate this work into your product/project, please
be aware that you will need to conduct a thorough licensing review to determine
the overall implications of including this work. For the current status of this
project through the Apache Incubator visit:
https://incubator.apache.org/projects/kie.html
