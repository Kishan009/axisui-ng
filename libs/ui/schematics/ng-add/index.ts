import {
  Rule,
  SchematicContext,
  Tree,
  chain,
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from "@schematics/angular/utility/dependencies";
import { getWorkspace } from "@schematics/angular/utility/workspace";

import { Schema } from "./schema";
import {
  AXISUI_STYLES_MARKER,
  pickStylePath,
  POSTCSS_CONFIG,
  withAxisUiStyles,
} from "./styles";

const TAILWIND_DEPS: ReadonlyArray<{ name: string; version: string }> = [
  { name: "tailwindcss", version: "^4.0.0" },
  { name: "@tailwindcss/postcss", version: "^4.0.0" },
];

/**
 * Runtime peer dependencies AxisUI components import but that npm will not
 * auto-install (they are peers of transitive `@axisui-ng/*` packages). Several
 * categories — forms, overlays, overlays-core, navigation — import from
 * `@angular/cdk`, so without this a production build fails to resolve
 * `@angular/cdk/{overlay,portal,bidi,a11y}`.
 */
const RUNTIME_DEPS: ReadonlyArray<{ name: string; version: string }> = [
  { name: "@angular/cdk", version: "^20.0.0" },
];

/** `ng add @axisui-ng/angular` — wire Tailwind v4 + AxisUI tokens into the app. */
export function ngAdd(options: Schema): Rule {
  return chain([
    addTailwindDependencies(),
    addRuntimeDependencies(),
    addPostcssConfig(),
    wireGlobalStyles(options),
    scheduleInstallAndReport(),
  ]);
}

function addTailwindDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    for (const dep of TAILWIND_DEPS) {
      addPackageJsonDependency(tree, {
        type: NodeDependencyType.Dev,
        name: dep.name,
        version: dep.version,
        overwrite: false,
      });
      context.logger.info(`Added devDependency ${dep.name}@${dep.version}`);
    }
    return tree;
  };
}

function addRuntimeDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    for (const dep of RUNTIME_DEPS) {
      addPackageJsonDependency(tree, {
        type: NodeDependencyType.Default,
        name: dep.name,
        version: dep.version,
        overwrite: false,
      });
      context.logger.info(`Added dependency ${dep.name}@${dep.version}`);
    }
    return tree;
  };
}

function addPostcssConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (
      tree.exists(".postcssrc.json") ||
      tree.exists(".postcssrc") ||
      tree.exists("postcss.config.js")
    ) {
      context.logger.info("PostCSS config already present — left unchanged.");
      return tree;
    }
    tree.create(
      ".postcssrc.json",
      JSON.stringify(POSTCSS_CONFIG, null, 2) + "\n",
    );
    context.logger.info("Created .postcssrc.json with the Tailwind v4 plugin.");
    return tree;
  };
}

function wireGlobalStyles(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const projectName =
      options.project ??
      (workspace.extensions["defaultProject"] as string | undefined) ??
      [...workspace.projects.keys()][0];
    const project = projectName
      ? workspace.projects.get(projectName)
      : undefined;

    if (!project) {
      context.logger.warn(
        "No Angular project found — add the AxisUI import to your global stylesheet manually.",
      );
      return;
    }

    const stylePath = pickStylePath(project.targets.get("build")?.options?.["styles"]);
    if (!stylePath) {
      context.logger.warn(
        `No global stylesheet found for "${projectName}". Add "@import '${AXISUI_STYLES_MARKER}';" and a @source rule manually.`,
      );
      return;
    }

    const current = tree.read(stylePath)?.toString("utf8") ?? "";
    const next = withAxisUiStyles(current);
    if (next === current) {
      context.logger.info("AxisUI styles already wired.");
      return;
    }
    tree.overwrite(stylePath, next);
    context.logger.info(`Wired AxisUI tokens into ${stylePath}.`);
  };
}

function scheduleInstallAndReport(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.info(
      "\nAxisUI is set up. Restart `ng serve` to pick up the new styles.\nDocs: https://axisui.dev",
    );
    return tree;
  };
}
