import "@patternfly/react-core/dist/styles/base.css";
import "reactflow/dist/style.css";
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RF from "reactflow";
import { ErrorBoundary, ErrorBoundaryPropsWithFallback } from "react-error-boundary";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { original } from "immer";
import { PMML } from "@kie-tools/pmml-editor-marshaller";
import { DmnLatestModel, DmnMarshaller, AllDmnMarshallers, getMarshaller } from "@kie-tools/dmn-marshaller";
import { Normalized, normalize } from "@kie-tools/dmn-marshaller/dist/normalization/normalize";
import { FileIcon } from "@patternfly/react-icons/dist/js/icons/file-icon";
import { InfrastructureIcon } from "@patternfly/react-icons/dist/js/icons/infrastructure-icon";
import { PficonTemplateIcon } from "@patternfly/react-icons/dist/js/icons/pficon-template-icon";
import { Drawer, DrawerContent, DrawerContentBody } from "@patternfly/react-core/dist/js/components/Drawer";
import { Label } from "@patternfly/react-core/dist/js/components/Label";
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@reach/tabs";
import "@reach/tabs/styles.css";
import { BoxedExpressionScreen } from "./boxedExpressions/BoxedExpressionScreen";
import { DataTypes } from "./dataTypes/DataTypes";
import { Diagram, DiagramRef } from "./diagram/Diagram";
import { DmnVersionLabel } from "./diagram/DmnVersionLabel";
import { BoxedExpressionPropertiesPanel } from "./propertiesPanel/BoxedExpressionPropertiesPanel";
import { DmnEditorContextProvider, useDmnEditor } from "./DmnEditorContext";
import { DmnEditorErrorFallback } from "./DmnEditorErrorFallback";
import {
  DmnEditorExternalModelsContextProvider,
  useExternalModels,
} from "./includedModels/DmnEditorDependenciesContext";
import { IncludedModels } from "./includedModels/IncludedModels";
import { DiagramPropertiesPanel } from "./propertiesPanel/DiagramPropertiesPanel";
import { ComputedStateCache } from "./store/ComputedStateCache";
import { Computed, DmnEditorTab, createDmnEditorStore, defaultStaticState } from "./store/Store";
import { DmnEditorStoreApiContext, StoreApiType, useDmnEditorStore, useDmnEditorStoreApi } from "./store/StoreContext";
import { DmnDiagramSvg } from "./svg/DmnDiagramSvg";
import { useEffectAfterFirstRender } from "./useEffectAfterFirstRender";
import { INITIAL_COMPUTED_CACHE } from "./store/computed/initial";
import { Commands, CommandsContextProvider, useCommands } from "./commands/CommandsContextProvider";
import { DmnEditorSettingsContextProvider } from "./settings/DmnEditorSettingsContext";
import { JavaCodeCompletionService } from "@kie-tools/import-java-classes-component/dist/components/ImportJavaClasses/services";
import "@kie-tools/dmn-marshaller/dist/kie-extensions";
import "./DmnEditor.css";
import { isStructurallyEqual, parseFeelExpression } from "./feel/feel-ast-parser";
import { CodeXml, CodeXmlIcon, FileBoxIcon, FileCheck, FileCheck2 } from "lucide-react";
import { CodeIcon } from "@patternfly/react-icons/dist/js/icons";
import { LegendsPalette } from "./diagram/LegendPalette";
import { getExpressionDiffDetails } from "./diff";
import { I18nDictionariesProvider } from "@kie-tools-core/i18n/dist/react-components";
import { dmnEditorDictionaries, DmnEditorI18nContext, dmnEditorI18nDefaults, useDmnEditorI18n } from "./i18n";


// Chakra UI Tabs sometimes cause TSX typing issues in this codebase; cast them to React components to satisfy the JSX type checker.
const ChakraTabs = Tabs;
const ChakraTabsList = TabList;
const ChakraTabPanels = TabPanels;
const ChakraTabPanel = TabPanel;
const ChakraTab = Tab ;

const ON_MODEL_CHANGE_DEBOUNCE_TIME_IN_MS = 500;
const SVG_PADDING = 20;

export type DmnEditorRef = {
  reset: (mode: DmnLatestModel) => void;
  getDiagramSvg: () => Promise<string | undefined>;
  openBoxedExpressionEditor: (nodeId: string) => void;
  closeBoxedExpressionEditor: () => void;
  getCommands: () => Commands;
  getModel: () => Normalized<DmnLatestModel>;
  diff: (content: string) => void;
  closeDiff: () => void;
  compareModels: (content1: string, content2: string) => void;
  highlightTitle: (drgElementId: string) => void;
  setHighlightedNodeIds: (ids: string[]) => void;
  openBothBoxedExpressionEditors: (nodeId: string) => void;
  fitView: () => void;
  computeNodeResult: (resultMap:string)=>void;
  clearNodeResult: () => void;
  changeLocale:(locale:string)=>void;
};

export type NodeEvaluationResults = {
  evaluationResult: EvaluationResult;
  evaluationHitsCountByRuleOrRowId: Map<string, number>;
};

export type EvaluationResult = "succeeded" | "failed" | "skipped";
export type EvaluationResultsByNodeId = Map<string, NodeEvaluationResults>;
export type ValidationMessages = Record<string, any>;
export type OnDmnModelChange = (model: Normalized<DmnLatestModel>) => void;
export type OnRequestToJumpToPath = (normalizedPosixPathRelativeToTheOpenFile: string) => void;
export type OnRequestToResolvePath = (normalizedPosixPathRelativeToTheOpenFile: string) => string;
export type OnRequestExternalModelsAvailableToInclude = () => Promise<string[]>;
export type OnRequestExternalModelByPath = (
  normalizedPosixPathRelativeToTheOpenFile: string
) => Promise<ExternalModel | null>;
export type ExternalModelsIndex = Record<string, ExternalModel | undefined>;
export type ExternalModel = ({ type: "dmn" } & ExternalDmn) | ({ type: "pmml" } & ExternalPmml);
export type ExternalDmnsIndex = Map<string, ExternalDmn>;
export type ExternalDmn = {
  model: Normalized<DmnLatestModel>;
  normalizedPosixPathRelativeToTheOpenFile: string;
  svg: string;
};
export type ExternalPmmlsIndex = Map<string, ExternalPmml>;
export type ExternalPmml = { model: PMML; normalizedPosixPathRelativeToTheOpenFile: string };

export type DmnEditorProps = {
  model: DmnLatestModel;
  originalVersion?: AllDmnMarshallers["version"];
  onModelChange?: OnDmnModelChange;
  onRequestExternalModelByPath?: OnRequestExternalModelByPath;
  onRequestExternalModelsAvailableToInclude?: OnRequestExternalModelsAvailableToInclude;
  externalModelsByNamespace?: ExternalModelsIndex;
  evaluationResultsByNodeId?: EvaluationResultsByNodeId;
  validationMessages?: ValidationMessages;
  externalContextName?: string;
  externalContextDescription?: string;
  issueTrackerHref?: string;
  isEvaluationHighlightsSupported?: boolean;
  isReadOnly?: boolean;
  isImportDataTypesFromJavaClassesSupported?: boolean;
  javaCodeCompletionService?: JavaCodeCompletionService;
  onRequestToJumpToPath?: OnRequestToJumpToPath;
  onRequestToResolvePath?: OnRequestToResolvePath;
  onModelDebounceStateChanged?: (changed: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenedBoxedExpressionEditorNodeChange?: (newOpenedNodeId: string | undefined) => void;
  onDiffFileOpened?: (content: string) => void;
  isDiffMode?: boolean;
  onCloseDiff?: () => void;
  diffResult?: any;
  expressionDiffResult?: any;
  locale:string;
};

export const DmnEditorInternal = ({
  model,
  originalVersion,
  onModelChange,
  onOpenedBoxedExpressionEditorNodeChange,
  onModelDebounceStateChanged,
  forwardRef,
  onDiffFileOpened,
  isDiffMode,
  onCloseDiff,
  diffResult,
  expressionDiffResult,
  isReadOnly,
  onUndo,
  onRedo,
  locale,
}: DmnEditorProps & {
  forwardRef?: React.Ref<DmnEditorRef>;
}) => {
  const boxedExpressionEditorActiveDrgElementId = useDmnEditorStore((s) => s.boxedExpressionEditor.activeDrgElementId);
  const dmnEditorActiveTab = useDmnEditorStore((s) => s.navigation.tab);
  const isBeePropertiesPanelOpen = useDmnEditorStore((s) => s.boxedExpressionEditor.propertiesPanel.isOpen);
  const isDiagramPropertiesPanelOpen = useDmnEditorStore((s) => s.diagram.propertiesPanel.isOpen);
  const navigationTab = useDmnEditorStore((s) => s.navigation.tab);
  const dmn = useDmnEditorStore((s) => s.dmn);
  const isDiagramEditingInProgress = useDmnEditorStore((s) => s.computed(s).isDiagramEditingInProgress());
  const dmnEditorStoreApi = useDmnEditorStoreApi();
  const { commandsRef } = useCommands();
  const { dmnModelBeforeEditingRef, dmnEditorRootElementRef } = useDmnEditor();
  const { externalModelsByNamespace } = useExternalModels();

  useEffect(() => {
    onOpenedBoxedExpressionEditorNodeChange?.(
      dmnEditorActiveTab === DmnEditorTab.EDITOR ? boxedExpressionEditorActiveDrgElementId : undefined
    );
  }, [boxedExpressionEditorActiveDrgElementId, dmnEditorActiveTab, onOpenedBoxedExpressionEditorNodeChange]);
  const { i18n} =useDmnEditorI18n();
  const diagramRef = useRef<DiagramRef>(null);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const beeContainerRef = useRef<HTMLDivElement | null>(null);
  const drawerContentRef = useRef<HTMLDivElement | null>(null);

  const hasFitViewRun = useRef(false);
  const lastModelIdRef = useRef<string | undefined>();

  useEffect(() => {
    if(!hasFitViewRun.current){
      setTimeout(() => {
        diagramRef.current?.fitView({ maxZoom: 0.8, minZoom: 0.1, duration: 400 });
        hasFitViewRun.current = true;
      }, 100);
    }
  }, [dmn.model]);


  useImperativeHandle(
    forwardRef,
    () => ({
      reset: (model) => {
        const state = dmnEditorStoreApi.getState();
        return state.dispatch(state).dmn.reset(normalize(model));
      },
      openBoxedExpressionEditor: (nodeId: string) => {
        dmnEditorStoreApi.setState((state) => {
          state.navigation.tab = DmnEditorTab.EDITOR;
          state.dispatch(state).boxedExpressionEditor.open(nodeId);
        });
      },
      closeBoxedExpressionEditor: () => {
        dmnEditorStoreApi.setState((state) => {
          state.dispatch(state).boxedExpressionEditor.close();
        });
      },
      getDiagramSvg: async () => {
        const nodes = diagramRef.current?.getReactFlowInstance()?.getNodes();
        const edges = diagramRef.current?.getReactFlowInstance()?.getEdges();
        if (!nodes || !edges) {
          return undefined;
        }

        const bounds = RF.getNodesBounds(nodes);
        const state = dmnEditorStoreApi.getState();

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", bounds.width + SVG_PADDING * 2 + "");
        svg.setAttribute(
          "height",
          bounds.height + (state.computed(state).isAlternativeInputDataShape() ? SVG_PADDING * 5 : SVG_PADDING * 2) + ""
        );

        ReactDOM.render(
          <g transform={`translate(${-bounds.x + SVG_PADDING} ${-bounds.y + SVG_PADDING})`}>
            <DmnDiagramSvg
              nodes={nodes}
              edges={edges}
              snapGrid={state.diagram.snapGrid}
              importsByNamespace={state.computed(state).importsByNamespace()}
              thisDmn={state.dmn}
              isAlternativeInputDataShape={state.computed(state).isAlternativeInputDataShape()}
              allDataTypesById={state.computed(state).getDataTypes(externalModelsByNamespace).allDataTypesById}
              allTopLevelItemDefinitionUniqueNames={
                state.computed(state).getDataTypes(externalModelsByNamespace).allTopLevelItemDefinitionUniqueNames
              }
            />
          </g>,
          svg
        );

        return new XMLSerializer().serializeToString(svg);
      },
      getModel: () => dmn.model,
      getCommands: () => commandsRef.current,
      diff: (..._args: any[]) => {},
      closeDiff: (..._args: any[]) => {},
      compareModels: (..._args: any[]) => {},
      highlightTitle: (drgElementId: string) => {
        dmnEditorStoreApi.setState((state) => {
          if (state.diagram.highlightedNodeIds.has(drgElementId)) {
            state.diagram.highlightedNodeIds.delete(drgElementId);
          } else {
            state.diagram.highlightedNodeIds.add(drgElementId);
          }
        });
      },
      setHighlightedNodeIds: (ids: string[]) => {
        dmnEditorStoreApi.setState((state) => {
          state.diagram.highlightedNodeIds = new Set([
            ...state.diagram.highlightedNodeIds,
            ...ids,
          ]);
        });
      },
      openBothBoxedExpressionEditors(..._args: any[]) {},
      fitView: () => {
        diagramRef.current?.fitView({ maxZoom: 0.8, minZoom: 0.1, duration: 400 });
      },
      computeNodeResult: (resultMap:string) => {
        try {
          const parsed = JSON.parse(resultMap); // Convert JSON string to object
          const result = new Map<string, any>(Object.entries(parsed));
          dmnEditorStoreApi.setState((state) => {
            state.diagram.nodeResult = result;
          });
        } catch (error) {
          console.error("Failed to parse nodeResult JSON:", error);
        }
      },
      clearNodeResult: () => {
        dmnEditorStoreApi.setState((state) => {state.diagram.nodeResult = new Map<string, any>();});
      },
      changeLocale: (..._args: any[]) => {},
    }),
    [dmnEditorStoreApi, externalModelsByNamespace, commandsRef, dmn.model]
  );

  useEffectAfterFirstRender(() => {
    const newModelId = model.definitions["@_id"]; // or any unique identifier
    if (lastModelIdRef.current !== newModelId) {
      lastModelIdRef.current = newModelId;
      hasFitViewRun.current = false;
    }
    dmnEditorStoreApi.setState((state) => {
      if (model === original(state.dmn.model)) {
        return;
      }

      state.diagram.autoLayout.canAutoGenerateDrd =
        model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] === undefined &&
        model.definitions.drgElement !== undefined;
      state.dmn.model = normalize(model);

      dmnModelBeforeEditingRef.current = state.dmn.model;
    });
  }, [dmnEditorStoreApi, model]);

  useStateAsItWasBeforeConditionBecameTrue(
    dmn.model,
    isDiagramEditingInProgress,
    useCallback((prev) => (dmnModelBeforeEditingRef.current = prev), [dmnModelBeforeEditingRef])
  );

  useEffectAfterFirstRender(() => {
    if (isDiagramEditingInProgress) {
      return;
    }
    onModelDebounceStateChanged?.(false);

    const timeout = setTimeout(() => {
      if (model === dmn.model) {
        return;
      }

      onModelDebounceStateChanged?.(true);
      console.debug("DMN EDITOR: Model changed!");
      onModelChange?.(dmn.model);
    }, ON_MODEL_CHANGE_DEBOUNCE_TIME_IN_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isDiagramEditingInProgress, onModelChange, dmn.model]);

  const getTabIndex = (tab: DmnEditorTab): number => {
    switch (tab) {
      case DmnEditorTab.EDITOR:
        return 0;
      case DmnEditorTab.DATA_TYPES:
        return 1;
      case DmnEditorTab.INCLUDED_MODELS:
        return 2;
      default:
        return 0;
    }
  };

  const getTabFromIndex = (index: number): DmnEditorTab => {
    switch (index) {
      case 0:
        return DmnEditorTab.EDITOR;
      case 1:
        return DmnEditorTab.DATA_TYPES;
      case 2:
        return DmnEditorTab.INCLUDED_MODELS;
      default:
        return DmnEditorTab.EDITOR;
    }
  };

  const onTabChanged = useCallback(
    (index: number) => {
      const tabValue = getTabFromIndex(index);

      dmnEditorStoreApi.setState((state) => {
        state.navigation.tab = tabValue;
        if (tabValue === DmnEditorTab.DATA_TYPES) {
          state.dataTypesEditor.activeItemDefinitionId =
            state.dataTypesEditor.activeItemDefinitionId ?? state.dmn.model.definitions.itemDefinition?.[0]?.["@_id"];
        }
        if (tabValue === DmnEditorTab.EDITOR && isDiffMode) {
          setTimeout(() => {
            diagramRef.current?.fitView({ maxZoom: 0.8, minZoom: 0.1, duration: 400 });
          }, 100);
        }
      });
    },
    [dmnEditorStoreApi]
  );

  const diagramPropertiesPanel = useMemo(() => <DiagramPropertiesPanel />, []);
  const beePropertiesPanel = useMemo(() => <BoxedExpressionPropertiesPanel locale={locale} />, []);

  useEffect(() => {
    drawerContentRef.current =
      (beeContainerRef?.current?.parentElement?.parentElement as HTMLDivElement | undefined) ?? null;
  }, [beeContainerRef]);
  const prevBoxedExpressionNodeIdRef = useRef<string | undefined>();
  const [DmnEditorTabName,setDmnEditorTabName]= useState("Editor");
  const [BusinessEntityTabName,setBusinessEntityTabName]= useState("Business Entity");
  const [IncludedModelsTabName,setIncludedModelsTabName]= useState("Included Models");
  useEffect(()=>{
    setDmnEditorTabName(i18n.dmnEditor.editor);
    setBusinessEntityTabName(i18n.dmnEditor.dataTypes);
    setIncludedModelsTabName(i18n.dmnEditor.includedModels);
  },[i18n]);
  useEffect(() => {
    // if(isReadOnly || isDiffMode){
    //   const wasOpen = prevBoxedExpressionNodeIdRef.current;
    //   const isClosedNow = !boxedExpressionEditorActiveDrgElementId;

    //   if (wasOpen && isClosedNow) {
    //     // We just returned from BoxedExpressionScreen to Editor
    //     setTimeout(() => {
    //       diagramRef.current?.fitView({ maxZoom: 0.8, minZoom: 0.1, duration: 400 });
    //     }, 100);
    //   }

    //   prevBoxedExpressionNodeIdRef.current = boxedExpressionEditorActiveDrgElementId;
    // }

  }, [boxedExpressionEditorActiveDrgElementId,isDiffMode,isReadOnly]);


  return (
    <ChakraTabs
      index={getTabIndex(navigationTab)}
      onChange={onTabChanged}
      className={"kie-dmn-editor--tabs"}
      style={{ height: "100%", display: "flex", flexDirection: "column",fontSize:"14px" }}
    >
    <ChakraTabsList
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        overflowX: "auto",
        padding: diffResult?"0 1px":"0 15px",
        height: diffResult?"58px":"40px",
      }}
    >
        <ChakraTab style={{
          alignItems: "center",
          padding: "9px 12px",
          margin: "0 4px",
          border: "none",
          borderBottom: "2px solid transparent",
          background: "none",
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
            <CodeXmlIcon style={{ marginRight: "8px",height:"14px",width:"14px" }} />
            {DmnEditorTabName}
        </ChakraTab>
        <ChakraTab style={{
          alignItems: "center",
          padding: "9px 12px",
          margin: "0 4px",
          border: "none",
          borderBottom: "2px solid transparent",
          background: "none",
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
            <InfrastructureIcon style={{ marginRight: "8px",height:"14px",width:"14px" }} />
            {BusinessEntityTabName}
            <Label style={{ padding: "0 12px", marginLeft: "8px" ,fontSize:"14px"}}>
              {dmn.model.definitions.itemDefinition?.length ?? 0}
            </Label>
        </ChakraTab>
        <ChakraTab style={{
          alignItems: "center",
          padding: "9px 12px",
          margin: "0 4px",
          border: "none",
          borderBottom: "2px solid transparent",
          background: "none",
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
            < FileBoxIcon style={{ marginRight: "8px",height:"14px",width:"14px" }} />
            {IncludedModelsTabName}
            <Label style={{ padding: "0 12px", marginLeft: "8px",fontSize:"14px" }}>
              {dmn.model.definitions.import?.length ?? 0}
            </Label>
        </ChakraTab>
      </ChakraTabsList>

      <ChakraTabPanels style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column",width:"100%",maxWidth:"100%" }}>
        {/* <style>{`
          [data-reach-tab-panel][hidden] {
            display: none !important;
          }
        `}</style> */}

        <ChakraTabPanel style={{ display: navigationTab === DmnEditorTab.EDITOR ? "flex" : "none",flex: 1, flexDirection: "column",height: "100%", width: "100%",maxWidth:"100%", padding: 0  }}>
          {navigationTab === DmnEditorTab.EDITOR && (
            <>
            {/* {isDiffMode && (
              <div style={{ position: "absolute", bottom: "8px", left: "8px", zIndex: 9999 }}>
                <LegendsPalette />
              </div>
            )} */}

              {!boxedExpressionEditorActiveDrgElementId && (
                <Drawer isExpanded={isDiagramPropertiesPanelOpen} isInline={true} position={"right"}>
                  <DrawerContent panelContent={diagramPropertiesPanel}>
                    <DrawerContentBody>
                      <div
                        className={"kie-tools--dmn-editor--diagram-container"}
                        ref={diagramContainerRef}
                        data-testid={"kie-tools--dmn-editor--diagram-container"}
                      >
                        {/* {originalVersion && <DmnVersionLabel version={originalVersion} />} */}
                        <Diagram
                          ref={diagramRef}
                          container={diagramContainerRef}
                          onDiffFileOpened={onDiffFileOpened}
                          isDiffMode={isDiffMode}
                          onCloseDiff={onCloseDiff}
                          diffResult={diffResult}
                          isReadOnly={isDiffMode || isReadOnly}
                          onUndo={onUndo}
                          onRedo={onRedo}
                        />
                      </div>
                    </DrawerContentBody>
                  </DrawerContent>
                </Drawer>
              )}
              {boxedExpressionEditorActiveDrgElementId && (
                <Drawer isExpanded={isBeePropertiesPanelOpen} isInline={true} position={"right"}>
                  <DrawerContent panelContent={beePropertiesPanel}>
                    <DrawerContentBody>
                      <div className={"kie-dmn-editor--bee-container"} ref={beeContainerRef}>
                        <BoxedExpressionScreen
                          container={drawerContentRef}
                          diffResult={diffResult}
                          expressionDiffResult={expressionDiffResult}
                          isReadOnly={isReadOnly || isDiffMode}
                          locale={locale}
                        />
                      </div>
                    </DrawerContentBody>
                  </DrawerContent>
                </Drawer>
              )}
            </>
          )}
        </ChakraTabPanel>

        <ChakraTabPanel style={{ display: navigationTab === DmnEditorTab.DATA_TYPES ? "flex" : "none",height: "100%", width: "100%", padding: "0px", flex: 1, overflow: "auto",position:"relative",backgroundColor: "#eff0f1",background:"#eff0f1" }}>
          <div data-testid={"kie-tools--dmn-editor--data-types-container"}>
            {navigationTab === DmnEditorTab.DATA_TYPES && <DataTypes locale={locale} />}
          </div>
        </ChakraTabPanel>

        <ChakraTabPanel style={{ display: navigationTab === DmnEditorTab.INCLUDED_MODELS ? "flex" : "none",height: "100%", width: "100%", padding: "0px", flex: 1, overflow: "auto",backgroundColor: "#eff0f1",background:"#eff0f1" }}>
          <div data-testid={"kie-tools--dmn-editor--included-models-container"} style={{width:"100%"}}>
            {navigationTab === DmnEditorTab.INCLUDED_MODELS && <IncludedModels />}
          </div>
        </ChakraTabPanel>
      </ChakraTabPanels>

      <style>{`
        .kie-dmn-editor--tabs [data-reach-tab][data-selected] {
          color: rgba(10, 88, 202, 1) !important;
          border-bottom-color: rgba(10, 88, 202, 1) !important;
        }

        .kie-dmn-editor--tabs [data-reach-tab][data-selected] svg {
          color: rgba(10, 88, 202, 1) !important;
        }

        .kie-dmn-editor--tabs [data-reach-tab]:hover {
          background-color: rgba(10, 88, 202, 0.05);
        }
      `}</style>
    </ChakraTabs>
  );
};

const DmnEditorWithStore = React.forwardRef((props: DmnEditorProps, ref: React.Ref<DmnEditorRef>) => {
  const store = useMemo(
    () => createDmnEditorStore(props.model, new ComputedStateCache<Computed>(INITIAL_COMPUTED_CACHE)),
    [props.model]
  );
  const storeRef = React.useRef<StoreApiType>(store);

  const resetState: ErrorBoundaryPropsWithFallback["onReset"] = useCallback(({ args }) => {
    storeRef.current?.setState((state) => {
      state.diagram = defaultStaticState().diagram;
      state.dmn.model = args[0];
    });
  }, []);

  return (
    <div
      className={props.isDiffMode ? "diff-mode" : ""}
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
      }}
    >
      <I18nDictionariesProvider
        defaults={dmnEditorI18nDefaults}
        dictionaries={dmnEditorDictionaries}
        locale={props.locale}
        ctx={DmnEditorI18nContext}
      >
        <DmnEditorContextProvider {...props}>
          <ErrorBoundary FallbackComponent={DmnEditorErrorFallback} onReset={resetState}>
            <DmnEditorSettingsContextProvider {...props} isDiffMode={props.isDiffMode}>
              <DmnEditorExternalModelsContextProvider {...props}>
                <DmnEditorStoreApiContext.Provider value={storeRef.current}>
                  <CommandsContextProvider>
                    <DmnEditorInternal forwardRef={ref} {...props} />
                  </CommandsContextProvider>
                </DmnEditorStoreApiContext.Provider>
              </DmnEditorExternalModelsContextProvider>
            </DmnEditorSettingsContextProvider>
          </ErrorBoundary>
        </DmnEditorContextProvider>
      </I18nDictionariesProvider>
    </div>
  );
});

export type DiffStatus = "added" | "deleted" | "updated" | "unchanged";
export type ExpressionDiffStatus = "added" | "deleted" | "updated";
type Change = {
  path: string;
  before: any;
  after: any;
};

const regex =
  /\([^()]+\)|[A-Za-z_][A-Za-z0-9_.]*(?:\s*[-+*/]\s*\d+(?:\.\d+)?)?|[-+*/<>!=]=?|then|else|if|and|or|not|true|false|\d+(?:\.\d+)?/g;

function tokenizeFeelExpression(expr: string): string[] {
  return expr.match(regex) ?? [];
}




type ChangeMap = Map<string, Change[]>;

function normalizeVal(val: any) {
  if (val && typeof val === "object" && "__$$text" in val) {
    return val.__$$text;
  }
  return val;
}


export function getChangedModelDiffs(currentModel: any, previousModel: any): Map<string, Map<string, Change[]>> {
  const diffsById: Map<string, Map<string, Change[]>> = new Map<string, Map<string, Change[]>>();
  const extractExpressions = (model: any): Map<string, any> => {
    const elements = Array.isArray(model?.definitions?.drgElement)
      ? model.definitions.drgElement
      : model?.definitions?.drgElement
      ? [model.definitions.drgElement]
      : [];

    const map = new Map<string, any>();
    for (const el of elements) {
      const eid = el ? el?.expression?.["@_id"] : undefined;
      if (eid) {
        map.set(eid, el.expression);
      }
    }
    for (const el of elements) {
      const eid = el ? el?.encapsulatedLogic?.expression?.["@_id"] : undefined;
      if (eid) {
        map.set(eid, el.encapsulatedLogic.expression);
      }
    }
    return map;
  };

  const currentExprs = extractExpressions(currentModel);
  const previousExprs = extractExpressions(previousModel);

  const allIds = new Set([...Array.from(currentExprs.keys()), ...Array.from(previousExprs.keys())]);

  for (const id of allIds) {

    const previousExpr = previousExprs.get(id);
    const currentExpr = currentExprs.get(id);
    if (previousExpr && !currentExpr) {
      // deleted in current
      diffsById.set(id, new Map([
        [id, [{ path: id, before: previousExpr, after: undefined }]]
      ]));
      continue;
    }

    if (!previousExpr && currentExpr) {
      // added in current
      diffsById.set(id, new Map([
        [id, [{ path: id, before: undefined, after: currentExpr }]]
      ]));
      continue;
    }

    const status=getExpressionDiffDetails(previousExpr, currentExpr,diffsById,false);
    diffsById.set(id, status);
  }

  return diffsById;
}

export function getDetailedDiffById(
  originalModel: any,
  newModel: any,
  modelDiff: Map<string, Map<string, Change[]>>
): { diffMap: Map<string, DiffStatus>; highlightIds: string[] } {
  const diffMap = new Map<string, DiffStatus>();
  const highlightIds: string[] = [];

  const compareFeelExpressions = (exprA?: string, exprB?: string) => {
    const a = exprA || "";
    const b = exprB || "";
    if (a === b) return true;

    try {
      const parsedA = tokenizeFeelExpression(a);
      const parsedB = tokenizeFeelExpression(b);
      return isStructurallyEqual(parsedA, parsedB);
    } catch (err) {
      console.warn("FEEL parse error, falling back to string comparison", err);
      return a === b;
    }
  };

  const toArray = (val: any) => (val ? (Array.isArray(val) ? val : [val]) : []);

  const extractElements = (model: any) => {
    const elements = toArray(model?.definitions?.drgElement);
    return new Map(elements.map((el) => [el["@_id"], el]));
  };

  const orig = extractElements(originalModel);
  const next = extractElements(newModel);
  const allIds = new Set([...orig.keys(), ...next.keys()]);

  for (const id of allIds) {
    if (!orig.has(id)) {
      diffMap.set(id, "added");
    } else if (!next.has(id)) {
      diffMap.set(id, "deleted");
    } else {
      const drg1 = orig.get(id);
      const drg2 = next.get(id);
      if (drg1?.["@_name"] !== drg2?.["@_name"]) {
        diffMap.set(id, "updated");
        highlightIds.push(id);
      }
      if (drg1["__$$element"] === "decision") {
        const idExp = drg1.expression ? drg1.expression["@_id"] : "";
        const exprChanges = modelDiff.get(idExp);
        if (exprChanges && exprChanges.size > 0) {
          let hasActualChanges = false;
          for (const [, changeArray] of exprChanges) {
            if (changeArray && changeArray.length > 0) {
              hasActualChanges = true;
              break;
            }
          }

          if (hasActualChanges) {
            diffMap.set(id, "updated");
          }
        }
      } else if (drg1["__$$element"] === "inputData") {
        const var1 = drg1.variable;
        const var2 = drg2.variable;

        if (
          var1?.["@_name"] !== var2?.["@_name"] ||
          var1?.["@_typeRef"] !== var2?.["@_typeRef"] ||
          var1?.["@_id"] !== var2?.["@_id"]
        ) {
          diffMap.set(id, "updated");
        }
      } else if (drg1?.["__$$element"] === "bkm") {
        let isModified = false;

        if (JSON.stringify(drg1?.variable) !== JSON.stringify(drg2?.variable)) {
          isModified = true;
        }

        const expId = drg1?.encapsulatedLogic?.expression?.["@_id"];
        if (expId) {
          const exprChanges = modelDiff.get(expId);
          if (exprChanges && exprChanges.size > 0) {
            let hasActualChanges = false;
            for (const [, changeArray] of exprChanges) {
              if (changeArray && changeArray.length > 0) {
                hasActualChanges = true;
                break;
              }
            }
            if (hasActualChanges) {
              isModified = true;
            }
          }
        }

        const params1 = toArray(drg1?.encapsulatedLogic?.formalParameter);
        const params2 = toArray(drg2?.encapsulatedLogic?.formalParameter);
        if (params1.length !== params2.length) {
          isModified = true;
        } else {
          for (let i = 0; i < params1.length; i++) {
            if (
              params1[i]?.["@_name"] !== params2[i]?.["@_name"] ||
              params1[i]?.["@_typeRef"] !== params2[i]?.["@_typeRef"]
            ) {
              isModified = true;
              break;
            }
          }
        }

        if (isModified) {
          diffMap.set(id, "updated");
        }
      }
    }
  }
  return { diffMap, highlightIds };
}

export const DmnEditor = React.forwardRef((props: DmnEditorProps, ref: React.Ref<DmnEditorRef>) => {
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffDmn, setDiffDmn] = useState<Normalized<DmnLatestModel> | null>(null);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [expressionDiffResult, setExpressionDiffResult] = useState<any>(null);
  const [reversedDiffResult, setReversedDiffResult] = useState<any>(null);
  const [reversedExpressionDiffResult, setReversedExpressionDiffResult] = useState<any>(null);
  const innerRef = useRef<DmnEditorRef>(null);
  const rightRef = useRef<DmnEditorRef>(null);
  const dmnEditorStoreApi = useDmnEditorStoreApi();
  const [idSet, setIdSet] = useState(new Set());
  const [dmn1Ids, setDmn1Ids] = useState(new Set<string>());
  const [dmn2Ids, setDmn2Ids] = useState(new Set<string>());
  const isSyncing = useRef(false);
  const [locale, setLocale] = useState<string>(props.locale);
  useEffect(() => {
    setLocale(props.locale);
  }, [props.locale]);
  const onModelChange: OnDmnModelChange = useCallback(
    (model) => {
      props.onModelChange?.(model);
    },
    [props.onModelChange]
  );
  // const nodeResultJson = `{
  //   "validate Profession": "null",
  //   "validate maximum and minimum card limit": "null",
  //   "current employment": "null jhbcwdnsjkncjkwsd,ncjkwendscjknxdsjkcn,xjkwdsncjkwdsncjksdncjkdsncjkdscnjkdsncjkdsncxjkdsnx",
  //   "New Decision": "null",
  //   "validate Nationality": "null",
  //   "validate Employer Segment": "null",
  //   "is satisfying generic criteria": "null",
  //   "validate Length of Service": "null",
  //   "validate age": " null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null null"
  // }`;


  //innerRef.current?.computeNodeResult(nodeResultJson);

  const onOpenedBeeNodeChange = useCallback(
    (nodeId: string | undefined, from: "left" | "right") => {
      if (isSyncing.current) {
        return;
      }

      props.onOpenedBoxedExpressionEditorNodeChange?.(nodeId);

      if (!isDiffMode) {
        return;
      }

      isSyncing.current = true;

      const targetRef = from === "left" ? rightRef : innerRef;
      const targetNodeIds = from === "left" ? dmn2Ids : dmn1Ids;

      if (nodeId && targetNodeIds.has(nodeId)) {
        targetRef.current?.openBoxedExpressionEditor(nodeId);
      } else {
        targetRef.current?.closeBoxedExpressionEditor();
      }

      Promise.resolve().then(() => {
        isSyncing.current = false;
      });
    },
    [isDiffMode, dmn1Ids, dmn2Ids, props.onOpenedBoxedExpressionEditorNodeChange]
  );

  const onLeftOpenedBeeNodeChange = useCallback(
    (nodeId: string | undefined) => {
      onOpenedBeeNodeChange(nodeId, "left");
    },
    [onOpenedBeeNodeChange]
  );

  const onRightOpenedBeeNodeChange = useCallback(
    (nodeId: string | undefined) => {
      onOpenedBeeNodeChange(nodeId, "right");
    },
    [onOpenedBeeNodeChange]
  );
  const changeLocale = useCallback((locale:string)=>{
    setLocale(locale);
  },[]);
  const diff = useCallback(
    (content: string) => {
      if (content.trim().length === 0) {
        return;
      }
      try {
        const marshaller = getMarshaller(content, { upgradeTo: "latest" });
        const newDmnModel = marshaller.parser.parse();
        const normalizedNewDmnModel = normalize(newDmnModel);

        const oldDmnModel = props.model;
        const normalizedOldDmnModel = normalize(oldDmnModel);

        const dmn1IdsSet = new Set<string>();
        oldDmnModel.definitions?.drgElement?.forEach((drg) => {
          dmn1IdsSet.add(drg["@_id"]!);
        });
        setDmn1Ids(dmn1IdsSet);

        const dmn2IdsSet = new Set<string>();
        newDmnModel.definitions?.drgElement?.forEach((drg) => {
          dmn2IdsSet.add(drg["@_id"]!);
        });
        setDmn2Ids(dmn2IdsSet);

        const commonIds = new Set([...dmn1IdsSet].filter((id) => dmn2IdsSet.has(id)));
        setIdSet(commonIds);

        setDiffDmn(normalizedNewDmnModel);
        setIsDiffMode(true);
        const modelDiff = getChangedModelDiffs(oldDmnModel, newDmnModel);
        setExpressionDiffResult(modelDiff);
        const reverseModelDiff = getChangedModelDiffs(newDmnModel, oldDmnModel);
        const diffMap = getDetailedDiffById(normalizedNewDmnModel, normalizedOldDmnModel, modelDiff);
        setDiffResult(diffMap.diffMap);
        const reverseDiff = getDetailedDiffById(normalizedOldDmnModel, normalizedNewDmnModel, reverseModelDiff);
        setReversedDiffResult(reverseDiff.diffMap);
        setReversedExpressionDiffResult(reverseModelDiff);
        // innerRef.current?.setHighlightedNodeIds([]);
        // rightRef.current?.setHighlightedNodeIds([]);
        // dmnEditorStoreApi.setState((state) => {
        //   state.diagram.diffStatus = new Map();
        // });
        // innerRef.current?.setHighlightedNodeIds(diffMap.highlightIds);
        // rightRef.current?.setHighlightedNodeIds(reverseDiff.highlightIds);
        for (const id of diffMap.highlightIds) {
          innerRef.current?.highlightTitle(id);
        }
        for (const id of reverseDiff.highlightIds) {
          rightRef.current?.highlightTitle(id);
        }
        setTimeout(() => {
          innerRef.current?.fitView();
          rightRef.current?.fitView();
        }, 100);
      } catch (e) {
        console.error("Error parsing DMN file for diff", e);
      }
    },
    [props.model]
  );

  const closeDiff = useCallback(() => {
    setIsDiffMode(false);
    setDiffDmn(null);
    setDiffResult(null);
    setReversedDiffResult(null);
    setExpressionDiffResult(null);
    setReversedExpressionDiffResult(null);
    // innerRef.current?.setHighlightedNodeIds([]);
    // rightRef.current?.setHighlightedNodeIds([]);
    setTimeout(() => {
      innerRef.current?.fitView();
    }, 100);
  }, []);

  const compareModels = useCallback(
    (content1: string, content2: string) => {
      const marshaller1 = getMarshaller(content1, { upgradeTo: "latest" });
      const baseDmnModel = marshaller1.parser.parse();
      const normalizedBaseModel = normalize(baseDmnModel);

      dmnEditorStoreApi.setState((state) => {
        state.dmn.model = normalize(normalizedBaseModel);
      });
      diff(content2);
    },
    [diff, dmnEditorStoreApi]
  );
  // const computeNodeResult=useCallback(
  //   (nodeResult:string)=>{
  //     innerRef.current?.computeNodeResult(nodeResult);

  //   },[]
  // );
  // const clearNodeResult=useCallback(
  //   ()=>{
  //     innerRef.current?.clearNodeResult();
  //   },[]
  // );
  const openeBothBoxedExpressionEditor = useCallback(
    (id: string) => {
      if (isDiffMode && idSet.has(id)) {
        innerRef.current?.openBoxedExpressionEditor(id);
        rightRef.current?.openBoxedExpressionEditor(id);
      } else {
        innerRef.current?.openBoxedExpressionEditor(id);
      }
    },
    [idSet, isDiffMode]
  );




  useImperativeHandle(
    ref,
    () => ({
      reset: (...args) => innerRef.current?.reset(...args),
      getDiagramSvg: (...args) =>
        innerRef.current?.getDiagramSvg(...args)
          ? Promise.resolve(innerRef.current?.getDiagramSvg(...args))
          : Promise.resolve(undefined),
      openBoxedExpressionEditor: (nodeId) => {
        if (isDiffMode) {
          if (dmn1Ids.has(nodeId)) {
            innerRef.current?.openBoxedExpressionEditor(nodeId);
          }
          if (dmn2Ids.has(nodeId)) {
            rightRef.current?.openBoxedExpressionEditor(nodeId);
          }
        } else {
          innerRef.current?.openBoxedExpressionEditor(nodeId);
        }
      },
      getCommands: (...args) => innerRef.current!.getCommands(...args),
      getModel: (...args) => innerRef.current!.getModel(...args),
      diff,
      closeDiff,
      compareModels,
      highlightTitle: (...args) => innerRef.current?.highlightTitle(...args),
      setHighlightedNodeIds: (...args) => innerRef.current?.setHighlightedNodeIds(...args),
      openBothBoxedExpressionEditors(nodeId) {
        openeBothBoxedExpressionEditor(nodeId);
      },
      closeBoxedExpressionEditor: (...args) => innerRef.current?.closeBoxedExpressionEditor(...args),
      fitView: () => {
        innerRef.current?.fitView();
      },
      computeNodeResult: (...args) => {
        innerRef.current?.computeNodeResult(...args);
      },
      clearNodeResult:(...args) => innerRef.current?.clearNodeResult(...args),
      changeLocale:changeLocale,
    }),
    [diff, closeDiff, compareModels, openeBothBoxedExpressionEditor, isDiffMode, dmn1Ids, dmn2Ids]
  );

  const onDiffFileOpened = useCallback((content: string) => diff(content), [diff]);
  const onCloseDiffCallback = useCallback(() => closeDiff(), [closeDiff]);

  const propsWithDiff = {
    ...props,
    onModelChange,
    onDiffFileOpened,
    isDiffMode,
    onCloseDiff: onCloseDiffCallback,
    diffResult,
    expressionDiffResult,
    onOpenedBoxedExpressionEditorNodeChange: onLeftOpenedBeeNodeChange,
  };

  function flipDiffStatus(diffMap?: Map<string, DiffStatus>): Map<string, DiffStatus> | undefined {
    if (!diffMap) return undefined;
    const flipped = new Map<string, DiffStatus>();
    const extra =new Map<string, "added"|"deleted"|"updated"|"undefined">();
    diffMap.forEach((status, id) => {
      if (status === "added"){ flipped.set(id, "deleted"); extra.set(id,"deleted");}
      else if (status === "deleted"){ flipped.set(id, "added");extra.set(id,"added");}
      else if (status === "updated"){ flipped.set(id, "updated");extra.set(id,"updated");}
      else {flipped.set(id, status);extra.set(id,"undefined");}

    });
    return flipped;
  }

  return (
    <div style={{ display: "flex", minWidth: "0", width: "100%", height: "100%" }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DmnEditorWithStore {...propsWithDiff} ref={innerRef} locale={locale}/>
      </div>
      {isDiffMode && diffDmn && (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #CED6E0",
          }}
        >
          <DmnEditorWithStore
            {...props}
            model={diffDmn}
            isReadOnly={true}
            diffResult={flipDiffStatus(reversedDiffResult)}
            expressionDiffResult={expressionDiffResult}
            ref={rightRef}
            onOpenedBoxedExpressionEditorNodeChange={onRightOpenedBeeNodeChange}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
});

export function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T>(value);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}

export function useStateAsItWasBeforeConditionBecameTrue<T>(state: T, condition: boolean, set: (prev: T) => void) {
  const previous = usePrevious(state);

  useEffect(() => {
    if (condition) {
      console.debug("HOOK: `useStateBeforeCondition` --> ASSIGN");
      set(previous);
    }
  }, [condition, set]);
}
