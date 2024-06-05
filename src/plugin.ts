import type ts from "typescript/lib/tsserverlibrary";
import path from "node:path";
import fs from "node:fs";
import { clone, findBazelWorkspaceRoot } from "./utils";
import { DocumentPosition, LanguageService } from "./types";

/** Initialize the tsserver plugin. */
export function plugin({ typescript: ts }: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
    function create(pluginCreateInfo: ts.server.PluginCreateInfo): LanguageService {
        const languageService = pluginCreateInfo.languageService as LanguageService;
        const project = pluginCreateInfo.project;
        const logger = project.projectService.logger;

        // We're doing a Bad Thing™ by relying on a private property of the language service, so
        // let's at least be defensive and fail gracefully if our assumptions are violated
        if (languageService.getSourceMapper == null) {
            logger.msg("Language service does not have required 'getSourceMapper()' method", ts.server.Msg.Err);
            return languageService;
        }

        // Find the Bazel workspace root
        const bazelWorkspaceRoot = findBazelWorkspaceRoot(project.getCurrentDirectory());
        if (bazelWorkspaceRoot == null) {
            logger.msg(
                "Could not determine the Bazel workspace root from " + project.getCurrentDirectory(),
                ts.server.Msg.Err,
            );
            return languageService;
        }
        if (logger.hasLevel(ts.server.LogLevel.verbose)) {
            logger.info(`Determined the Bazel workspace root to be: ${bazelWorkspaceRoot}`);
        }

        const languageServiceProxy = clone(languageService as LanguageService);

        languageServiceProxy.getSourceMapper = () => {
            const sourceMapper = languageService.getSourceMapper();
            if (sourceMapper == null) {
                return sourceMapper;
            }

            const sourceMapperProxy = clone(sourceMapper);

            sourceMapperProxy.tryGetSourcePosition = (pos: DocumentPosition): DocumentPosition | undefined => {
                // Delegate to the original, underlying source mapper
                const res: DocumentPosition | undefined = sourceMapper.tryGetSourcePosition(pos);

                // If the source mapper results point to a file in bazel-out that exists in the source tree,
                // re-map it on the fly to the corresponding source file
                if (res != null) {
                    const match = res.fileName.match(/\/execroot\/_main\/bazel-out\/[^\/]+\/bin\/(.+)$/);
                    if (match != null && match.length > 1) {
                        const fromFileName = res.fileName;
                        const toFileName = path.join(bazelWorkspaceRoot, match[1]);
                        if (fs.existsSync(toFileName)) {
                            res.fileName = toFileName;

                            if (logger.hasLevel(ts.server.LogLevel.verbose)) {
                                logger.info(`Remapped ${fromFileName} -> ${toFileName}`);
                            }
                        }
                    }
                }

                return res;
            };

            return sourceMapperProxy;
        };

        return languageServiceProxy;
    }

    return { create };
}
