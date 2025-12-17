import * as React from "react";
import { Button, Tooltip } from "@patternfly/react-core";
import { ExpandArrowsAltIcon, SearchMinusIcon, SearchPlusIcon } from "@patternfly/react-icons";
import { useBoxedExpressionEditor, useBoxedExpressionEditorDispatch } from "../BoxedExpressionEditorContext";
import "./ExpressionEditorPalette.css";

export function ExpressionEditorPalette() {
  const { zoom } = useBoxedExpressionEditor();
  const { onZoomChange, onFitView } = useBoxedExpressionEditorDispatch();

  return (
    <div className="expression-editor-palette">
      <Tooltip content={"Fit to view"} position="top">
        <Button variant="plain" onClick={onFitView}>
          <ExpandArrowsAltIcon />
        </Button>
      </Tooltip>
      <Tooltip content={"Zoom out"} position="top">
        <Button variant="plain" onClick={() => onZoomChange(zoom - 0.1)}>
          <SearchMinusIcon />
        </Button>
      </Tooltip>
      <Tooltip content={"Zoom in"} position="top">
        <Button variant="plain" onClick={() => onZoomChange(zoom + 0.1)}>
          <SearchPlusIcon />
        </Button>
      </Tooltip>
    </div>
  );
}
