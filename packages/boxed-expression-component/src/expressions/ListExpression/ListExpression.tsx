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

import * as React from "react";
import { useCallback, useMemo } from "react";
import * as ReactTable from "react-table";
import {
  Action,
  BeeTableCellProps,
  BeeTableContextMenuAllowedOperationsConditions,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  BeeTableOperationConfig,
  BeeTableProps,
  BoxedExpression,
  BoxedList,
  DmnBuiltInDataType,
  ExpressionChangedArgs,
  generateUuid,
  Normalized,
} from "../../api";
import { useBoxedExpressionEditorI18n } from "../../i18n";
import { useNestedExpressionContainerWithNestedExpressions } from "../../resizing/Hooks";
import { NestedExpressionContainerContext } from "../../resizing/NestedExpressionContainerContext";
import { LIST_EXPRESSION_EXTRA_WIDTH, LIST_EXPRESSION_ITEM_MIN_WIDTH } from "../../resizing/WidthConstants";
import { BeeTable, BeeTableColumnUpdate } from "../../table/BeeTable";
import { useBoxedExpressionEditor, useBoxedExpressionEditorDispatch } from "../../BoxedExpressionEditorContext";
import { DEFAULT_EXPRESSION_VARIABLE_NAME } from "../../expressionVariable/ExpressionVariableMenu";
import { ListItemCell } from "./ListItemCell";
import { ResizerStopBehavior } from "../../resizing/ResizingWidthsContext";
import { DMN_LATEST__tContextEntry } from "@kie-tools/dmn-marshaller";
import { findAllIdsDeep } from "../../ids/ids";
import "./ListExpression.css";

export type ROWTYPE = Normalized<DMN_LATEST__tContextEntry> & {
  rowIndexDiffStatus?: "added" | "deleted";
};

type Change = {
  path: string;
  before: any;
  after: any;
};

type ChangeMap = Map<string, Change[]>;


export function ListExpression({
  isNested,
  parentElementId,
  expression: listExpression,
  diffsById,
}: {
  expression: Normalized<BoxedList>;
  isNested: boolean;
  parentElementId: string;
  diffsById: any;
}) {
  const { i18n } = useBoxedExpressionEditorI18n();
  const { setExpression, setWidthsById } = useBoxedExpressionEditorDispatch();
  const { expressionHolderId, widthsById, isReadOnly } = useBoxedExpressionEditor();

  const id = listExpression["@_id"]!;

  /// //////////////////////////////////////////////////////
  /// ///////////// RESIZING WIDTHS ////////////////////////
  /// //////////////////////////////////////////////////////

  const { nestedExpressionContainerValue, onColumnResizingWidthChange } =
    useNestedExpressionContainerWithNestedExpressions(
      useMemo(() => {
        const nestedExpressions = listExpression.expression ?? [];

        return {
          nestedExpressions: nestedExpressions,
          fixedColumnActualWidth: 0,
          fixedColumnResizingWidth: { value: 0, isPivoting: false },
          fixedColumnMinWidth: 0,
          nestedExpressionMinWidth: LIST_EXPRESSION_ITEM_MIN_WIDTH,
          extraWidth: LIST_EXPRESSION_EXTRA_WIDTH,
          expression: listExpression,
          flexibleColumnIndex: 1,
          widthsById: widthsById,
        };
      }, [listExpression, widthsById])
    );

  /// //////////////////////////////////////////////////////

  const beeTableOperationConfig = useMemo<BeeTableOperationConfig>(
    () => [
      {
        group: i18n.rows,
        items: [
          { name: i18n.rowOperations.reset, type: BeeTableOperation.RowReset },
          { name: i18n.rowOperations.insertAbove, type: BeeTableOperation.RowInsertAbove },
          { name: i18n.rowOperations.insertBelow, type: BeeTableOperation.RowInsertBelow },
          { name: i18n.insert, type: BeeTableOperation.RowInsertN },
          { name: i18n.rowOperations.delete, type: BeeTableOperation.RowDelete },
        ],
      },
      {
        group: i18n.terms.selection.toUpperCase(),
        items: [
          { name: i18n.terms.copy, type: BeeTableOperation.SelectionCopy },
          { name: i18n.terms.cut, type: BeeTableOperation.SelectionCut },
          { name: i18n.terms.paste, type: BeeTableOperation.SelectionPaste },
          { name: i18n.terms.reset, type: BeeTableOperation.SelectionReset },
        ],
      },
    ],
    [i18n]
  );

  // Process diffsById to extract row-level add/delete and clean the map
  const { cleanedDiffsById, rowIndexDiffStatuses } = useMemo(() => {
    if (!diffsById) {
      return {
        cleanedDiffsById: diffsById,
        rowIndexDiffStatuses: new Map<string, "added" | "deleted">()
      };
    }

    // Get the raw change map for this list expression
    const raw = diffsById.get(id);

    if (!raw) {
      return {
        cleanedDiffsById: diffsById,
        rowIndexDiffStatuses: new Map<string, "added" | "deleted">()
      };
    }

    const cleanedMap = new Map(diffsById);
    const cleanedRaw = new Map(raw);
    const rowStatuses = new Map<string, "added" | "deleted">();

    // Iterate through all changes in the raw map
    for (const [itemId, changes] of raw.entries()) {
      let isRowLevelChange = false;

      for (const change of changes) {
        // Check if this is a row-level add/delete (path equals the itemId itself)
        if (change.path === itemId) {
          isRowLevelChange = true;

          if (change.before === undefined && change.after !== undefined) {
            rowStatuses.set(itemId, "added");
          } else if (change.before !== undefined && change.after === undefined) {
            rowStatuses.set(itemId, "deleted");
          }
          break;
        }
      }

      // If this was a row-level change, remove it from cleaned map
      if (isRowLevelChange) {
        cleanedRaw.delete(itemId);
      }
    }

    // Update the cleaned diffsById with the cleaned raw map
    if (cleanedRaw.size > 0) {
      cleanedMap.set(id, cleanedRaw);
    } else {
      cleanedMap.delete(id);
    }

    return { cleanedDiffsById: cleanedMap, rowIndexDiffStatuses: rowStatuses };
  }, [diffsById, id]);


  const beeTableRows = useMemo(() => {
    const raw = cleanedDiffsById?.get(id);

    const rows = (listExpression.expression ?? []).map((item, rowIndex) => {
      const rowId = item?.["@_id"] ?? generateUuid();

      // The key is a combination of the item's ID and its index.
      const rowKey = `${rowId}-${rowIndex}`;
      const rowIndexDiffStatus = rowIndexDiffStatuses.get(rowKey);

      // Get diff status for the expression itself (using cleaned map)
      const exprId = item?.["@_id"];
      let exprDiffStatus: "added" | "deleted" | "updated" | undefined;

      if (raw && exprId) {
        const changes = raw.get(exprId);
        if (changes && changes.length > 0) {
          for (const c of changes) {
            if (c.before === undefined && c.after !== undefined) {
              exprDiffStatus = "added";
            } else if (c.before !== undefined && c.after === undefined) {
              exprDiffStatus = "deleted";
            } else if (c.before !== c.after) {
              exprDiffStatus = "updated";
            }
          }
        }
      }

      return {
        "@_id": rowId,
        expression: item?.__$$element
          ? { ...item, diffStatus: exprDiffStatus }
          : undefined!,
        diffStatus: exprDiffStatus,
        rowIndexDiffStatus: rowIndexDiffStatus,
      };
    });

    if (rows.length === 0) {
      rows.push({
        "@_id": generateUuid(),
        expression: undefined!,
        diffStatus: undefined,
        rowIndexDiffStatus: undefined
      });
    }

    return rows;
  }, [listExpression.expression, cleanedDiffsById, rowIndexDiffStatuses, id, diffsById]);


  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(
    () => [
      {
        accessor: expressionHolderId as any,
        label: listExpression["@_label"] ?? DEFAULT_EXPRESSION_VARIABLE_NAME,
        dataType: listExpression["@_typeRef"] ?? DmnBuiltInDataType.Undefined,
        isRowIndexColumn: false,
        minWidth: LIST_EXPRESSION_ITEM_MIN_WIDTH,
        width: undefined,
      },
    ],
    [expressionHolderId, listExpression]
  );

  const getRowKey = useCallback((row: ReactTable.Row<ROWTYPE>) => {
    return row.id;
  }, []);

  const cellComponentByColumnAccessor: BeeTableProps<ROWTYPE>["cellComponentByColumnAccessor"] = useMemo(
    (): { [p: string]: ({ rowIndex, data, columnIndex }: BeeTableCellProps<ROWTYPE>) => JSX.Element } => ({
      [expressionHolderId]: (props) => (
        <ListItemCell
          parentElementId={parentElementId}
          listExpression={listExpression}
          diffsById={cleanedDiffsById}
          {...props}
        />
      ),
    }),
    [expressionHolderId, listExpression, parentElementId, cleanedDiffsById]
  );

  const onRowAdded = useCallback(
    (args: { beforeIndex: number; rowsCount: number }) => {
      setExpression({
        setExpressionAction: (prev: Normalized<BoxedList>) => {
          const newItems = [...(prev.expression ?? [])];
          const newListItems: Normalized<BoxedExpression>[] = [];

          for (let i = 0; i < args.rowsCount; i++) {
            newListItems.push(undefined!); // SPEC DISCREPANCY: Starting without an expression gives users the ability to select the expression type.
          }

          for (const newEntry of newListItems) {
            newItems.splice(args.beforeIndex, 0, newEntry);
          }

          const ret: Normalized<BoxedList> = {
            ...prev,
            expression: newItems,
          };

          return ret;
        },
        expressionChangedArgs: { action: Action.RowsAdded, rowIndex: args.beforeIndex, rowsCount: args.rowsCount },
      });
    },
    [setExpression]
  );

  const onRowDeleted = useCallback(
    (args: { rowIndex: number }) => {
      let oldExpression: Normalized<BoxedExpression> | undefined;
      setExpression({
        setExpressionAction: (prev: Normalized<BoxedList>) => {
          const newItems = [...(prev.expression ?? [])];
          oldExpression = newItems[args.rowIndex];
          newItems.splice(args.rowIndex, 1);

          // Do not inline this variable for type safety. See https://github.com/microsoft/TypeScript/issues/241
          const ret: Normalized<BoxedList> = {
            ...prev,
            expression: newItems,
          };

          return ret;
        },
        expressionChangedArgs: { action: Action.RowRemoved, rowIndex: args.rowIndex },
      });

      setWidthsById(({ newMap }) => {
        for (const id of findAllIdsDeep(oldExpression)) {
          newMap.delete(id);
        }
      });
    },
    [setExpression, setWidthsById]
  );

  const onRowReset = useCallback(
    (args: { rowIndex: number }) => {
      let oldExpression: Normalized<BoxedExpression> | undefined;
      setExpression({
        setExpressionAction: (prev: Normalized<BoxedList>) => {
          const newItems = [...(prev.expression ?? [])];
          oldExpression = newItems[args.rowIndex];
          newItems.splice(args.rowIndex, 1, undefined!); // SPEC DISCREPANCY: Starting without an expression gives users the ability to select the expression type.

          // Do not inline this variable for type safety. See https://github.com/microsoft/TypeScript/issues/241
          const ret: Normalized<BoxedList> = {
            ...prev,
            expression: newItems,
          };

          return ret;
        },
        expressionChangedArgs: { action: Action.RowReset, rowIndex: args.rowIndex },
      });

      setWidthsById(({ newMap }) => {
        for (const id of findAllIdsDeep(oldExpression)) {
          newMap.delete(id);
        }
      });
    },
    [setExpression, setWidthsById]
  );

  const beeTableHeaderVisibility = useMemo(() => {
    return isNested ? BeeTableHeaderVisibility.None : BeeTableHeaderVisibility.AllLevels;
  }, [isNested]);

  const onColumnUpdates = useCallback(
    ([{ name, typeRef }]: BeeTableColumnUpdate<ROWTYPE>[]) => {
      const expressionChangedArgs: ExpressionChangedArgs = {
        action: Action.VariableChanged,
        variableUuid: expressionHolderId,
        typeChange:
          typeRef !== listExpression["@_typeRef"]
            ? {
                from: listExpression["@_typeRef"] ?? "",
                to: typeRef,
              }
            : undefined,
        nameChange:
          name !== listExpression["@_label"]
            ? {
                from: listExpression["@_label"] ?? "",
                to: name,
              }
            : undefined,
      };

      setExpression({
        setExpressionAction: (prev: Normalized<BoxedList>) => {
          // Do not inline this variable for type safety. See https://github.com/microsoft/TypeScript/issues/241
          const ret: Normalized<BoxedList> = {
            ...prev,
            "@_label": name,
            "@_typeRef": typeRef,
          };

          return ret;
        },
        expressionChangedArgs,
      });
    },
    [expressionHolderId, listExpression, setExpression]
  );

  const allowedOperations = useCallback(
    (conditions: BeeTableContextMenuAllowedOperationsConditions) => {
      if (!conditions.selection.selectionStart || !conditions.selection.selectionEnd) {
        return [];
      }

      return [
        BeeTableOperation.SelectionCopy,
        ...(conditions.selection.selectionStart.rowIndex >= 0
          ? [
              BeeTableOperation.RowInsertAbove,
              BeeTableOperation.RowInsertBelow,
              BeeTableOperation.RowInsertN,
              ...(beeTableRows.length > 1 ? [BeeTableOperation.RowDelete] : []),
              BeeTableOperation.RowReset,
            ]
          : []),
      ];
    },
    [beeTableRows.length]
  );

  return (
    <NestedExpressionContainerContext.Provider value={nestedExpressionContainerValue}>
      <div className={`${listExpression["@_id"]} list-expression`}>
        <BeeTable<ROWTYPE>
          isReadOnly={isReadOnly}
          isEditableHeader={!isReadOnly}
          onColumnResizingWidthChange={onColumnResizingWidthChange}
          resizerStopBehavior={ResizerStopBehavior.SET_WIDTH_WHEN_SMALLER}
          tableId={listExpression["@_id"]}
          headerVisibility={beeTableHeaderVisibility}
          cellComponentByColumnAccessor={cellComponentByColumnAccessor}
          columns={beeTableColumns}
          rows={beeTableRows}
          operationConfig={beeTableOperationConfig}
          allowedOperations={allowedOperations}
          getRowKey={getRowKey}
          onRowAdded={onRowAdded}
          onRowDeleted={onRowDeleted}
          onRowReset={onRowReset}
          onColumnUpdates={onColumnUpdates}
          shouldRenderRowIndexColumn={true}
          shouldShowRowsInlineControls={true}
          shouldShowColumnsInlineControls={false}
        />
      </div>
    </NestedExpressionContainerContext.Provider>
  );
}
