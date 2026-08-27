import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "apps/web/tsconfig.json",
});

const sourceFile = project.getSourceFileOrThrow("apps/web/src/components/movies/index.tsx");

const componentNames = [
  "MovieCard",
  "MovieDetailsModal",
  "MovieEditModal",
  "SuggestionCard",
  "MovieSectionBody",
  "MovieRecommendationComposer",
  "MoviesTopControls",
  "MoviesView",
];

const componentsAndProps = [
  { name: "MovieCard", props: "MovieCardProps" },
  { name: "MovieDetailsModal", props: "MovieDetailsModalProps" },
  { name: "MovieEditModal", props: "MovieEditModalProps" },
  { name: "SuggestionCard", props: "SuggestionCardProps" },
  { name: "MovieSectionBody", props: "Props_MovieSectionBody" },
  { name: "MovieRecommendationComposer", props: "MovieRecommendationComposerProps" },
  { name: "MoviesTopControls", props: "MoviesTopControlsHandle" },
];

const importDecls = sourceFile.getImportDeclarations().map(d => d.getText());
const allExportedNames = new Set<string>();

for (const [name, decls] of sourceFile.getExportedDeclarations()) {
    allExportedNames.add(name);
}

const mainImportsStr = importDecls.join("\n") + "\n\nimport {\n" + 
    Array.from(allExportedNames)
    .filter(name => !componentNames.includes(name) && !componentsAndProps.some(c => c.props === name))
    .join(",\n") + "\n} from \"./shared\";\n\n";

for (const comp of componentsAndProps) {
  const v = sourceFile.getVariableStatement(comp.name);
  const p = sourceFile.getInterface(comp.props) || sourceFile.getTypeAlias(comp.props);
  const p2 = sourceFile.getInterface(comp.props + "Handle");

  let content = mainImportsStr;
  
  if (p2) content += p2.getText() + "\n\n";
  if (p) content += p.getText() + "\n\n";
  if (v) content += v.getText() + "\n\n";

  fs.writeFileSync(`apps/web/src/components/movies/${comp.name}.tsx`, content);
  
  if (p2) p2.remove();
  if (p) p.remove();
  if (v) v.remove();
}

const moviesViewVar = sourceFile.getVariableStatement("MoviesView");
if (moviesViewVar) {
  let content = mainImportsStr;
  content += "import { MovieCard } from \"./MovieCard\";\n";
  content += "import { MovieDetailsModal } from \"./MovieDetailsModal\";\n";
  content += "import { MovieEditModal } from \"./MovieEditModal\";\n";
  content += "import { SuggestionCard } from \"./SuggestionCard\";\n";
  content += "import { MovieSectionBody } from \"./MovieSectionBody\";\n";
  content += "import { MovieRecommendationComposer } from \"./MovieRecommendationComposer\";\n";
  content += "import { MoviesTopControls, type MoviesTopControlsHandle } from \"./MoviesTopControls\";\n\n";

  content += moviesViewVar.getText() + "\n\n";
  fs.writeFileSync(`apps/web/src/components/movies/MoviesView.tsx`, content);
  moviesViewVar.remove();
}

const sharedContent = sourceFile.getFullText();
fs.writeFileSync(`apps/web/src/components/movies/shared.tsx`, sharedContent);

fs.writeFileSync(`apps/web/src/components/movies/index.tsx`, `export { MoviesView as default, MoviesView } from "./MoviesView";\n`);
console.log("Done refactoring.");
