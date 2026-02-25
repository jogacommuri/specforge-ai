import { WorkflowDefinition } from "./types";
import { RequirementsStage } from "../stages/requirementsStage";
import { ArchitectureStage } from "../stages/architectureStage";
import { UiStage } from "../stages/uiStage";
import { ApiStage } from "../stages/apiStage";
import { TestStage } from "../stages/testStage";

export const ProductLifecycle: WorkflowDefinition = {
    stages: [
        RequirementsStage,
        ArchitectureStage,
        UiStage,
        ApiStage,
        TestStage
    ]
};
