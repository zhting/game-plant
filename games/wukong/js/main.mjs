// The Wukong document boots directly, with its own identity and campaign.
import { startArcade } from '/games/shared/arcade-engine.mjs?v=creator-1';
import { loadProjectSpec, loadProjectModules } from '/games/shared/project-spec.mjs?v=mods-1';
import * as wukongDependencies from './engine-dependencies.mjs?v=m4-1';

const [spec, modules] = await Promise.all([loadProjectSpec(), loadProjectModules()]);
startArcade(wukongDependencies, spec, modules);
